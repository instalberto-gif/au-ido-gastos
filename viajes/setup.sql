-- Ejecutar en Supabase SQL Editor. Mantiene separados los datos de Gastos y Vacaciones.
begin;
create table if not exists public.au_ido_viajes_privados (
 id uuid primary key, owner_id uuid not null references auth.users(id),
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<500000),
 updated_at timestamptz not null default now(), unique(id,owner_id)
);
create table if not exists public.au_ido_viajes_accesos (
 trip_id uuid not null, owner_id uuid not null,
 email text not null check(email=lower(email) and length(email) between 3 and 254),
 primary key(trip_id,email),
 foreign key(trip_id,owner_id) references public.au_ido_viajes_privados(id,owner_id) on delete cascade
);
alter table public.au_ido_viajes_privados enable row level security;
alter table public.au_ido_viajes_accesos enable row level security;
revoke all on public.au_ido_viajes_privados,public.au_ido_viajes_accesos from anon,authenticated;
grant select,insert,update,delete on public.au_ido_viajes_privados,public.au_ido_viajes_accesos to authenticated;
drop policy if exists "Mis accesos" on public.au_ido_viajes_accesos;
create policy "Mis accesos" on public.au_ido_viajes_accesos for select to authenticated
 using ((owner_id=auth.uid() or email=lower(auth.jwt()->>'email')) and exists(select 1 from public.au_ido_members where email=lower(auth.jwt()->>'email')));
drop policy if exists "Propietario autoriza" on public.au_ido_viajes_accesos;
create policy "Propietario autoriza" on public.au_ido_viajes_accesos for insert to authenticated
 with check(owner_id=auth.uid() and exists(select 1 from public.au_ido_members where email=lower(auth.jwt()->>'email')));
drop policy if exists "Propietario retira" on public.au_ido_viajes_accesos;
create policy "Propietario retira" on public.au_ido_viajes_accesos for delete to authenticated
 using(owner_id=auth.uid() and exists(select 1 from public.au_ido_members where email=lower(auth.jwt()->>'email')));
drop policy if exists "Ver viajes autorizados" on public.au_ido_viajes_privados;
create policy "Ver viajes autorizados" on public.au_ido_viajes_privados for select to authenticated
 using (exists(select 1 from public.au_ido_members where email=lower(auth.jwt()->>'email')) and
 (owner_id=auth.uid() or exists(select 1 from public.au_ido_viajes_accesos a where a.trip_id=au_ido_viajes_privados.id and a.email=lower(auth.jwt()->>'email'))));
drop policy if exists "Crear viajes propios" on public.au_ido_viajes_privados;
create policy "Crear viajes propios" on public.au_ido_viajes_privados for insert to authenticated
 with check(owner_id=auth.uid() and exists(select 1 from public.au_ido_members where email=lower(auth.jwt()->>'email')));
drop policy if exists "Editar viajes propios" on public.au_ido_viajes_privados;
create policy "Editar viajes propios" on public.au_ido_viajes_privados for update to authenticated
 using(owner_id=auth.uid() and exists(select 1 from public.au_ido_members where email=lower(auth.jwt()->>'email')))
 with check(owner_id=auth.uid() and exists(select 1 from public.au_ido_members where email=lower(auth.jwt()->>'email')));
drop policy if exists "Borrar viajes propios" on public.au_ido_viajes_privados;
create policy "Borrar viajes propios" on public.au_ido_viajes_privados for delete to authenticated
 using(owner_id=auth.uid() and exists(select 1 from public.au_ido_members where email=lower(auth.jwt()->>'email')));
commit;