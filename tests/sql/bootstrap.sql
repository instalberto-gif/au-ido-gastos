-- Solo para la base desechable de GitHub Actions. Nunca ejecutar en Supabase.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email',current_setting('request.jwt.claim.email',true)) $$;
grant usage on schema auth to authenticated;
create function public.test_expense_data(account uuid,trip uuid default null) returns jsonb language sql as $$
 select jsonb_build_object('id',account::text,'name','Cuenta de prueba','couples',jsonb_build_array(jsonb_build_object('id','pareja','name','Pareja')),'expenses','[]'::jsonb,'payments','[]'::jsonb) || case when trip is null then '{}'::jsonb else jsonb_build_object('travelId',trip::text) end
$$;
