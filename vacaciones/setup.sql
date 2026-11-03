-- AU Ido · Vacaciones. Ejecutar en SQL Editor del MISMO proyecto de gastos.
-- No modifica au_ido_trips ni au_ido_members. Requiere au_ido_members existente.
-- Todos los miembros ya autorizados en AU Ido pueden leer y editar este calendario.
begin;
create table if not exists public.au_ido_vacaciones(
 id text primary key check(id='grupo'),
 data jsonb not null check(
  data->>'format'='au-ido-vacaciones-v2'
  and jsonb_typeof(data->'users')='array'
  and jsonb_typeof(data->'years')='object'
  and octet_length(data::text)<=500000),
 revision integer not null default 1 check(revision>0),
 updated_at timestamptz not null default now()
);
alter table public.au_ido_vacaciones enable row level security;
revoke all on public.au_ido_vacaciones from anon, authenticated;
grant select,insert,update on public.au_ido_vacaciones to authenticated;
drop policy if exists "Vacaciones lectura grupo" on public.au_ido_vacaciones;
create policy "Vacaciones lectura grupo" on public.au_ido_vacaciones
 for select to authenticated using(exists(select 1 from public.au_ido_members where email=lower(auth.jwt()->>'email')));
drop policy if exists "Vacaciones alta grupo" on public.au_ido_vacaciones;
create policy "Vacaciones alta grupo" on public.au_ido_vacaciones
 for insert to authenticated with check(revision=1 and exists(select 1 from public.au_ido_members where email=lower(auth.jwt()->>'email')));
drop policy if exists "Vacaciones edición grupo" on public.au_ido_vacaciones;
create policy "Vacaciones edición grupo" on public.au_ido_vacaciones
 for update to authenticated
 using(exists(select 1 from public.au_ido_members where email=lower(auth.jwt()->>'email')))
 with check(exists(select 1 from public.au_ido_members where email=lower(auth.jwt()->>'email')));
create or replace function public.au_ido_vacaciones_revision()
 returns trigger language plpgsql set search_path='' as $$
begin
 if new.id<>old.id or new.revision<>old.revision+1 then
  raise exception 'Conflicto de versión: actualiza los datos';
 end if;
 new.updated_at=now();
 return new;
end;
$$;
drop trigger if exists vacaciones_revision on public.au_ido_vacaciones;
create trigger vacaciones_revision before update on public.au_ido_vacaciones
 for each row execute function public.au_ido_vacaciones_revision();
commit;
