set role authenticated;
set request.jwt.claim.sub='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set request.jwt.claim.email='a@example.test';
do $$ begin
 if (select count(*) from public.au_ido_registered_members())<>2 then raise exception 'Directorio incorrecto: debe filtrar no registrados, no confirmados y no autorizados'; end if;
 perform public.au_ido_save_travel_participants('11111111-1111-4111-8111-111111111111','{"nombre":"Viaje","legacyParticipants":["Cristina"]}',array['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid]);
 if not exists(select 1 from public.au_ido_viajes_accesos where email='b@example.test' and participant_access) then raise exception 'No se ha autorizado al participante'; end if;
 if (select data->'participantes' @> '["Cristina","Compañero"]'::jsonb from public.au_ido_viajes_privados where id='11111111-1111-4111-8111-111111111111') is not true then raise exception 'No se han conservado los nombres anteriores'; end if;
 begin
  perform public.au_ido_save_travel_participants('11111111-1111-4111-8111-111111111111','{"nombre":"Manipulado"}',array['dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid],(select updated_at from public.au_ido_viajes_privados where id='11111111-1111-4111-8111-111111111111'));
  raise exception 'Se ha admitido un usuario sin autorización';
 exception when check_violation then null; end;
 begin
  perform public.au_ido_save_travel_participants('11111111-1111-4111-8111-111111111111','{"nombre":"Cambio obsoleto"}','{}'::uuid[],'2000-01-01');
  raise exception 'Se ha sobrescrito un viaje con una versión obsoleta';
 exception when serialization_failure then null; end;
end $$;
set request.jwt.claim.sub='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
set request.jwt.claim.email='b@example.test';
do $$ begin
 if not exists(select 1 from public.au_ido_viajes_privados where id='11111111-1111-4111-8111-111111111111') then raise exception 'El participante no puede leer el viaje'; end if;
 begin
  perform public.au_ido_save_travel_participants('11111111-1111-4111-8111-111111111111','{"nombre":"Cambio ajeno"}','{}'::uuid[],(select updated_at from public.au_ido_viajes_privados where id='11111111-1111-4111-8111-111111111111'));
  raise exception 'El lector ha podido cambiar participantes';
 exception when insufficient_privilege then null; end;
end $$;
set request.jwt.claim.sub='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set request.jwt.claim.email='a@example.test';
select public.au_ido_save_travel_participants('11111111-1111-4111-8111-111111111111','{"nombre":"Viaje sin participantes"}','{}'::uuid[],(select updated_at from public.au_ido_viajes_privados where id='11111111-1111-4111-8111-111111111111'));
do $$ begin if exists(select 1 from public.au_ido_viajes_accesos where email='b@example.test') then raise exception 'No se ha retirado el acceso por participación'; end if;end $$;
-- Un permiso manual previo debe conservarse al desmarcar al participante.
insert into public.au_ido_viajes_accesos(trip_id,owner_id,email) values('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','b@example.test');
select public.au_ido_save_travel_participants('11111111-1111-4111-8111-111111111111','{"nombre":"Viaje"}',array['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid],(select updated_at from public.au_ido_viajes_privados where id='11111111-1111-4111-8111-111111111111'));
select public.au_ido_save_travel_participants('11111111-1111-4111-8111-111111111111','{"nombre":"Viaje"}','{}'::uuid[],(select updated_at from public.au_ido_viajes_privados where id='11111111-1111-4111-8111-111111111111'));
do $$ begin if not exists(select 1 from public.au_ido_viajes_accesos where email='b@example.test' and not participant_access) then raise exception 'Se ha eliminado un permiso manual'; end if;end $$;
set request.jwt.claim.sub='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
set request.jwt.claim.email='outsider@example.test';
do $$ begin
 begin perform public.au_ido_registered_members();raise exception 'Un usuario ajeno ha podido consultar el directorio';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'Directorio, permisos de participantes, conservación y concurrencia comprobados' as resultado;
