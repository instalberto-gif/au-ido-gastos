-- Solo para la base desechable de pruebas. Nunca ejecutar en producción.
alter table auth.users add column email text,add column email_confirmed_at timestamptz,add column raw_user_meta_data jsonb default '{}';
insert into auth.users values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a@example.test',now(),'{"full_name":"Alberto"}'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','b@example.test',now(),'{"full_name":"Compañero"}'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','pending@example.test',null,'{}'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','outsider@example.test',now(),'{}');
insert into public.au_ido_members values('a@example.test'),('b@example.test'),('pending@example.test'),('not-registered@example.test');
