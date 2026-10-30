-- Email is optional; telephone remains required.
alter table public.applications alter column email drop not null;
-- Apply once before enabling the interest form in production.
create table if not exists public.care_interests (
 id uuid primary key,
 region text not null check (char_length(region) between 2 and 80),
 location text check (char_length(location) <= 200),
 residence text not null,
 intent text not null,
 budget text not null,
 services text[] not null default '{}',
 contact text not null,
 email text,
 source text not null,
 phone_explanation boolean not null default false,
 consent_version text not null,
 consented_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now() + interval '6 months'),
 status text not null default 'new' check (status in ('new','contacted','closed'))
);
alter table public.care_interests enable row level security;
revoke all on public.care_interests from anon, authenticated;
grant all on public.care_interests to service_role;
create index if not exists care_interests_expiry on public.care_interests(expires_at);

-- One transaction: idempotent retry + bounded repeat submissions per phone.
create or replace function public.submit_care_interest(payload jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare receipt uuid := (payload->>'id')::uuid;
begin
 perform pg_advisory_xact_lock(hashtext(payload->>'contact'));
 if exists(select 1 from care_interests where id = receipt and contact = payload->>'contact') then return receipt; end if;
 if (select count(*) from care_interests where contact = payload->>'contact' and created_at > now() - interval '1 hour') >= 3 then
   raise exception 'TOO_MANY_REQUESTS';
 end if;
 insert into care_interests(id,region,location,residence,intent,budget,services,contact,email,source,phone_explanation,consent_version)
 values(receipt,payload->>'region',payload->>'location',payload->>'residence',payload->>'intent',payload->>'budget',
 ARRAY(select jsonb_array_elements_text(payload->'services')),payload->>'contact',payload->>'email',payload->>'source',
 (payload->>'phone_explanation')::boolean,payload->>'consent_version');
 return receipt;
end; $$;
revoke all on function public.submit_care_interest(jsonb) from public, anon, authenticated;
grant execute on function public.submit_care_interest(jsonb) to service_role;

-- Hourly expiry cleanup. Configure Supabase Cron with this SQL:
-- delete from public.care_interests where expires_at <= now();
-- This setup uses pg_cron; fail visibly if Cron is unavailable rather than silently skip deletion.
create extension if not exists pg_cron;
select cron.schedule('purge-care-interests', '17 * * * *',
 $$delete from public.care_interests where expires_at <= now()$$);

-- Ensure the existing diagnosis retention promise is also scheduled.
select cron.schedule('purge-expired', '23 * * * *',
 $$select public.purge_expired()$$);
