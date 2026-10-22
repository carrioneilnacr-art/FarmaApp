-- FarmaApp: acceso del asistente. Nunca incluir claves en este archivo.
create table if not exists public.assistant_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  requests integer not null default 0 check (requests >= 0),
  primary key (user_id, day)
);
alter table public.assistant_usage enable row level security;
revoke all on public.assistant_usage from anon, authenticated;

create or replace function public.farmaapp_claim_assistant_request(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare used integer;
begin
  insert into public.assistant_usage(user_id, day, requests)
  values (p_user_id, (now() at time zone 'America/Lima')::date, 1)
  on conflict (user_id, day) do update
    set requests = public.assistant_usage.requests + 1
    where public.assistant_usage.requests < 50
  returning requests into used;
  return used is not null;
end;
$$;
revoke all on function public.farmaapp_claim_assistant_request(uuid) from public, anon, authenticated;
grant execute on function public.farmaapp_claim_assistant_request(uuid) to service_role;

create or replace function public.farmaapp_openai_key()
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'farmaapp_openai_api_key'
  limit 1;
$$;
revoke all on function public.farmaapp_openai_key() from public, anon, authenticated;
grant execute on function public.farmaapp_openai_key() to service_role;
