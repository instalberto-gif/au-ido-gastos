-- Ejecutar en SQL Editor del mismo proyecto Supabase de AU Ido.
-- Requiere schema.sql y viajes/setup.sql ya activados.
-- Conserva cuentas antiguas sin vínculo para consultarlas y exportarlas.
-- Las altas y cualquier modificación posterior requieren un viaje existente.
begin;
alter table public.au_ido_trips add column if not exists travel_id uuid;

-- Recuperar únicamente identificadores que ya apuntan a un viaje real.
-- Se incrementa la revisión para respetar el control de concurrencia existente.
update public.au_ido_trips e
 set travel_id=v.id,
     data=jsonb_set(e.data,'{travelId}',to_jsonb(v.id::text)),
     revision=e.revision+1
 from public.au_ido_viajes_privados v
 where e.travel_id is null
   and case when e.data->>'travelId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            then (e.data->>'travelId')::uuid else null end=v.id;

do $$ begin
 if not exists(select 1 from pg_constraint where conrelid='public.au_ido_trips'::regclass and conname='au_ido_trips_existing_travel') then
  alter table public.au_ido_trips add constraint au_ido_trips_existing_travel
   foreign key(travel_id) references public.au_ido_viajes_privados(id) on delete restrict;
 end if;
end $$;
create index if not exists au_ido_trips_travel_id_idx on public.au_ido_trips(travel_id);

create or replace function public.au_ido_require_existing_travel()
 returns trigger language plpgsql security invoker set search_path='' as $$
declare target uuid;
begin
 if coalesce(new.data->>'travelId','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
  raise exception 'Vincula la cuenta a un viaje existente antes de guardar.' using errcode='23514';
 end if;
 target=(new.data->>'travelId')::uuid;
 -- Para crear o cambiar el vínculo, el viaje debe ser consultable por el usuario.
 -- Mantener el vínculo permite la edición compartida de Gastos sin hacer público
 -- el viaje privado ni conceder permisos adicionales sobre él.
 if tg_op='INSERT' then
  if not exists(select 1 from public.au_ido_viajes_privados where id=target) then
   raise exception 'El viaje no existe o tu cuenta no puede consultarlo.' using errcode='23503';
  end if;
 elsif old.travel_id is distinct from target then
  if not exists(select 1 from public.au_ido_viajes_privados where id=target) then
   raise exception 'El viaje no existe o tu cuenta no puede consultarlo.' using errcode='23503';
  end if;
 end if;
 new.travel_id=target;
 new.data=jsonb_set(new.data,'{travelId}',to_jsonb(target::text));
 return new;
end;
$$;
drop trigger if exists au_ido_require_existing_travel on public.au_ido_trips;
create trigger au_ido_require_existing_travel before insert or update on public.au_ido_trips
 for each row execute function public.au_ido_require_existing_travel();
commit;

-- Resultado informativo: cuentas antiguas que todavía necesitan vincularse.
select id,data->>'name' as cuenta_pendiente from public.au_ido_trips where travel_id is null;
