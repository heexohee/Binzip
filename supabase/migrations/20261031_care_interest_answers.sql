-- Nationwide survey: extra case/price answers and interview opt-in.
-- Apply before relying on these answers; until then submit_care_interest ignores the new payload keys.
alter table public.care_interests add column if not exists answers jsonb not null default '{}'::jsonb;
alter table public.care_interests add column if not exists interview_ok boolean not null default false;

create or replace function public.submit_care_interest(payload jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare receipt uuid := (payload->>'id')::uuid;
begin
 perform pg_advisory_xact_lock(hashtext(payload->>'contact'));
 if exists(select 1 from care_interests where id = receipt and contact = payload->>'contact') then return receipt; end if;
 if (select count(*) from care_interests where contact = payload->>'contact' and created_at > now() - interval '1 hour') >= 3 then
   raise exception 'TOO_MANY_REQUESTS';
 end if;
 insert into care_interests(id,region,location,residence,intent,budget,services,contact,email,source,phone_explanation,interview_ok,answers,consent_version)
 values(receipt,payload->>'region',payload->>'location',payload->>'residence',payload->>'intent',payload->>'budget',
 ARRAY(select jsonb_array_elements_text(payload->'services')),payload->>'contact',payload->>'email',payload->>'source',
 (payload->>'phone_explanation')::boolean,coalesce((payload->>'interview_ok')::boolean,false),coalesce(payload->'answers','{}'::jsonb),
 payload->>'consent_version');
 return receipt;
end; $$;
revoke all on function public.submit_care_interest(jsonb) from public, anon, authenticated;
grant execute on function public.submit_care_interest(jsonb) to service_role;
