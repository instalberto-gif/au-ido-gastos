-- Solo pruebas en una base desechable, con los mismos RLS y triggers del proyecto.
do $$ begin
 if (select count(*) from public.au_ido_trips)<>2 then raise exception 'Se han perdido cuentas antiguas'; end if;
 if (select travel_id is not null from public.au_ido_trips where id='22222222-2222-4222-8222-222222222222') then raise exception 'Se ha inventado un vínculo'; end if;
 if (select travel_id is null or revision<>2 from public.au_ido_trips where id='33333333-3333-4333-8333-333333333333') then raise exception 'El vínculo anterior no se ha migrado correctamente'; end if;
end $$;
set role authenticated;
set request.jwt.claim.sub='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set request.jwt.claim.email='a@example.test';
do $$ begin
 begin
  insert into public.au_ido_trips(id,data) values('44444444-4444-4444-8444-444444444444',public.test_expense_data('44444444-4444-4444-8444-444444444444'));
  raise exception 'Se ha permitido una cuenta sin viaje';
 exception when check_violation then null; end;
 begin
  insert into public.au_ido_trips(id,data) values('44444444-4444-4444-8444-444444444444',public.test_expense_data('44444444-4444-4444-8444-444444444444','99999999-9999-4999-8999-999999999999'));
  raise exception 'Se ha permitido un viaje inexistente';
 exception when foreign_key_violation then null; end;
 insert into public.au_ido_trips(id,data) values('44444444-4444-4444-8444-444444444444',public.test_expense_data('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111'));
 begin
  delete from public.au_ido_viajes_privados where id='11111111-1111-4111-8111-111111111111';
  raise exception 'Se ha permitido eliminar un viaje con cuentas';
 exception when foreign_key_violation then null; end;
end $$;
set request.jwt.claim.sub='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
set request.jwt.claim.email='b@example.test';
do $$ begin
 if exists(select 1 from public.au_ido_viajes_privados) then raise exception 'B puede leer el viaje privado de A'; end if;
 begin
  insert into public.au_ido_trips(id,data) values('55555555-5555-4555-8555-555555555555',public.test_expense_data('55555555-5555-4555-8555-555555555555','11111111-1111-4111-8111-111111111111'));
  raise exception 'B ha podido crear una cuenta sobre un viaje sin acceso';
 exception when foreign_key_violation then null; end;
 update public.au_ido_trips set revision=revision+1 where id='44444444-4444-4444-8444-444444444444';
 if not found then raise exception 'B no puede editar las cuentas del grupo'; end if;
 begin
  update public.au_ido_trips set revision=revision+1 where id='22222222-2222-4222-8222-222222222222';
  raise exception 'Se ha permitido modificar una cuenta antigua sin vincularla';
 exception when check_violation then null; end;
end $$;
reset role;
select 'Vínculos, conservación de datos, permisos y borrado comprobados' as resultado;
