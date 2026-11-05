insert into auth.users values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.au_ido_members values ('a@example.test'),('b@example.test');
insert into public.au_ido_viajes_privados(id,owner_id,data) values ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{"nombre":"Viaje privado A"}');
insert into public.au_ido_trips(id,data) values
 ('22222222-2222-4222-8222-222222222222',public.test_expense_data('22222222-2222-4222-8222-222222222222') || '{"travelId":"antiguo-no-valido"}'::jsonb),
 ('33333333-3333-4333-8333-333333333333',public.test_expense_data('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111'));
