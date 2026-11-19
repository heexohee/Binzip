-- Management is a subscription now: track 집 확인·계약 예정 (scheduled) and 구독 중 (subscribed)
-- between 상담 중 (contacted) and 해지·종료 (closed). Existing rows keep their status.
-- Apply in the Supabase SQL editor before choosing the new statuses on the admin screen.
do $$
declare c record;
begin
  -- Drop every existing check on care_interests.status, whatever Postgres named it.
  for c in select conname from pg_constraint
    where conrelid = 'public.care_interests'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.care_interests drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.care_interests add constraint care_interests_status_check
  check (status in ('new','contacted','scheduled','subscribed','closed'));
