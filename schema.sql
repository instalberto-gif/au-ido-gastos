-- Ejecutar una vez en el SQL Editor del proyecto Supabase.
-- Sustituir el correo del final por el del administrador ANTES de ejecutar.
begin;
create table public.au_ido_members (
 email text primary key check(email=lower(email))
);
alter table public.au_ido_members enable row level security;
create policy "Consultar mi autorización" on public.au_ido_members for select to authenticated
 using (email=lower(auth.jwt()->>'email'));
revoke all on public.au_ido_members from anon, authenticated;
grant select on public.au_ido_members to authenticated;

create table public.au_ido_trips (
 id uuid primary key,
 data jsonb not null check(jsonb_typeof(data)='object' and data->>'id'=id::text and jsonb_typeof(data->'couples')='array' and jsonb_typeof(data->'expenses')='array' and jsonb_typeof(data->'payments')='array' and length(data->>'name') between 1 and 160 and octet_length(data::text)<=500000),
 revision integer not null default 1 check(revision>0),
 updated_at timestamptz not null default now()
);
alter table public.au_ido_trips enable row level security;
create policy "Grupo autorizado lee viajes" on public.au_ido_trips for select to authenticated
 using (exists(select 1 from public.au_ido_members where email=lower(auth.jwt()->>'email')));
create policy "Grupo autorizado crea viajes" on public.au_ido_trips for insert to authenticated
 with check (revision=1 and exists(select 1 from public.au_ido_members where email=lower(auth.jwt()->>'email')));
create policy "Grupo autorizado modifica viajes" on public.au_ido_trips for update to authenticated
 using (exists(select 1 from public.au_ido_members where email=lower(auth.jwt()->>'email')))
 with check (exists(select 1 from public.au_ido_members where email=lower(auth.jwt()->>'email')));
revoke all on public.au_ido_trips from anon, authenticated;
grant select, insert, update on public.au_ido_trips to authenticated;

create function public.au_ido_check_revision() returns trigger language plpgsql set search_path='' as $$
begin
 if new.id<>old.id or new.revision<>old.revision+1 then raise exception 'Conflicto de versión: actualiza los datos'; end if;
 new.updated_at=now();
 return new;
end;
$$;
create trigger au_ido_revision before update on public.au_ido_trips for each row execute function public.au_ido_check_revision();

-- CAMBIAR este correo por el tuyo. Después añade los de tus amigos.
insert into public.au_ido_members(email) values ('cambia-esto@ejemplo.com');
commit;

-- Para autorizar a otra persona, ejecutar por separado:
-- insert into public.au_ido_members(email) values (lower('correo-del-amigo@ejemplo.com'));
-- Para revocar acceso:
-- delete from public.au_ido_members where email=lower('correo-del-amigo@ejemplo.com');
