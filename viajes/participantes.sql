-- Ejecutar en el SQL Editor del proyecto Supabase de AU Ido.
-- Requiere viajes/setup.sql y au_ido_members existentes. No elimina datos.
begin;
alter table public.au_ido_viajes_accesos add column if not exists participant_access boolean not null default false;

create or replace function public.au_ido_registered_members()
 returns table(id uuid,email text,name text) language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.au_ido_members m where m.email=lower(auth.jwt()->>'email')) then
  raise exception 'Tu cuenta no está autorizada en AU Ido.' using errcode='42501';
 end if;
 return query select u.id,lower(u.email)::text,
   left(coalesce(nullif(trim(u.raw_user_meta_data->>'display_name'),''),nullif(trim(u.raw_user_meta_data->>'full_name'),''),u.email),100)::text
  from auth.users u join public.au_ido_members m on m.email=lower(u.email)
  where u.email_confirmed_at is not null
  order by lower(u.email);
end $$;
revoke all on function public.au_ido_registered_members() from public,anon;
grant execute on function public.au_ido_registered_members() to authenticated;

create or replace function public.au_ido_save_travel_participants(
 p_id uuid,p_data jsonb,p_participant_ids uuid[],p_expected_updated_at timestamptz default null)
 returns setof public.au_ido_viajes_privados language plpgsql security definer set search_path='' as $$
declare previous public.au_ido_viajes_privados%rowtype;
 chosen uuid[]; profiles jsonb; names jsonb; legacy jsonb; resolved_data jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.au_ido_members m where m.email=lower(auth.jwt()->>'email')) then
  raise exception 'Tu cuenta no está autorizada en AU Ido.' using errcode='42501';
 end if;
 if p_id is null or p_data is null or jsonb_typeof(p_data)<>'object' or length(coalesce(p_data->>'nombre','')) not between 1 and 160 then
  raise exception 'Los datos del viaje no son válidos.' using errcode='23514';
 end if;
 if cardinality(coalesce(p_participant_ids,'{}'::uuid[]))>100 or array_position(p_participant_ids,null) is not null then
  raise exception 'La selección de participantes no es válida.' using errcode='23514';
 end if;
 select coalesce(array_agg(distinct x),'{}'::uuid[]) into chosen from unnest(coalesce(p_participant_ids,'{}'::uuid[])) x;
 if cardinality(chosen)<>(select count(*) from auth.users u join public.au_ido_members m on m.email=lower(u.email) where u.id=any(chosen) and u.email_confirmed_at is not null) then
  raise exception 'Uno de los participantes ya no está registrado, confirmado o autorizado. Actualiza el listado.' using errcode='23514';
 end if;
 select * into previous from public.au_ido_viajes_privados where id=p_id for update;
 if found then
  if previous.owner_id<>auth.uid() then raise exception 'Solo el propietario puede cambiar el viaje y sus participantes.' using errcode='42501'; end if;
  if p_expected_updated_at is null or previous.updated_at<>p_expected_updated_at then
   raise exception 'El viaje ha cambiado en otro dispositivo. Actualiza antes de guardar.' using errcode='40001';
  end if;
 elsif p_expected_updated_at is not null then
  raise exception 'El viaje ya no está disponible. Actualiza la lista.' using errcode='40001';
 end if;
 legacy=coalesce(p_data->'legacyParticipants','[]'::jsonb);
 if jsonb_typeof(legacy)<>'array' then raise exception 'Los nombres anteriores no son válidos.' using errcode='23514'; end if;
 if jsonb_array_length(legacy)>100 or exists(select 1 from jsonb_array_elements(legacy) x where jsonb_typeof(x)<>'string' or length(x#>>'{}')>100) then
  raise exception 'Los nombres anteriores no son válidos.' using errcode='23514';
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',u.id,'email',lower(u.email),'name',left(coalesce(nullif(trim(u.raw_user_meta_data->>'display_name'),''),nullif(trim(u.raw_user_meta_data->>'full_name'),''),u.email),100)) order by lower(u.email)),'[]'::jsonb)
  into profiles from auth.users u where u.id=any(chosen);
 select coalesce(jsonb_agg(n order by n),'[]'::jsonb) into names from
  (select distinct x->>'name' as n from jsonb_array_elements(profiles) x union select distinct x#>>'{}' from jsonb_array_elements(legacy) x) labels;
 if jsonb_array_length(names)>100 then raise exception 'Hay demasiados participantes y nombres anteriores. Revisa el listado.' using errcode='23514'; end if;
 resolved_data=p_data||jsonb_build_object('participantUsers',profiles,'legacyParticipants',legacy,'participantes',names);
 if octet_length(resolved_data::text)>450000 then raise exception 'El viaje supera el límite de datos. Reduce la foto o las rutas.' using errcode='23514'; end if;
 if previous.id is null then
  insert into public.au_ido_viajes_privados(id,owner_id,data) values(p_id,auth.uid(),resolved_data);
 else
  update public.au_ido_viajes_privados set data=resolved_data,updated_at=clock_timestamp() where id=p_id;
 end if;
 -- Retirar solo permisos que se concedieron por participación, conservando los manuales.
 delete from public.au_ido_viajes_accesos a where a.trip_id=p_id and a.participant_access
  and not exists(select 1 from auth.users u where u.id=any(chosen) and lower(u.email)=a.email);
 insert into public.au_ido_viajes_accesos(trip_id,owner_id,email,participant_access)
  select p_id,auth.uid(),lower(u.email),true from auth.users u where u.id=any(chosen) and u.id<>auth.uid()
  on conflict(trip_id,email) do nothing;
 return query select * from public.au_ido_viajes_privados where id=p_id;
end $$;
revoke all on function public.au_ido_save_travel_participants(uuid,jsonb,uuid[],timestamptz) from public,anon;
grant execute on function public.au_ido_save_travel_participants(uuid,jsonb,uuid[],timestamptz) to authenticated;
commit;
