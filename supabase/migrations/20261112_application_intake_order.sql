-- Easy-first application form (2026-11-12): region, vacancy, applicant role and ad creative label.
-- The app keeps saving applications without these columns until this runs (answers also stay in `condition`).
begin;
alter table public.applications
  add column if not exists region text check (region is null or char_length(region) <= 40),
  add column if not exists vacancy_period text
    check (vacancy_period is null or vacancy_period in ('1년이 안 됐어요', '1~3년', '3~5년', '5년이 넘었어요', '잘 모르겠어요')),
  add column if not exists applicant text
    check (applicant is null or applicant in ('소유자 본인', '자녀·가족', '기타')),
  -- Same rule as src/web-analytics.ts UTM_CONTENT_PATTERN: image_<name> or a numeric ad id. Never a free-form URL value.
  add column if not exists utm_content text
    check (utm_content is null or utm_content ~ '^(image_[a-z0-9_]{1,30}|[0-9]{5,30})$');

-- Photo submissions go through this function, so it must write the new columns too.
create or replace function public.create_application_with_photos(payload jsonb, photos jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare new_id uuid; photo jsonb; ordinal integer := 0; bytes bytea;
begin
  if jsonb_typeof(photos) is distinct from 'array' then raise exception 'INVALID_PHOTOS'; end if;
  if jsonb_array_length(photos) not between 1 and 6 then raise exception 'INVALID_PHOTO_COUNT'; end if;
  insert into public.applications (
    address, resolved_address, pnu, match_quality, condition, acquisition, ownership,
    concern, speed, channel, contact, email, created_at, expires_at, photo_count, source,
    region, vacancy_period, applicant, utm_content
  ) values (
    payload->>'address', payload->>'resolved_address', payload->>'pnu', payload->>'match_quality',
    payload->>'condition', payload->>'acquisition', payload->>'ownership', payload->>'concern',
    payload->>'speed', payload->>'channel', payload->>'contact', payload->>'email',
    (payload->>'created_at')::timestamptz, (payload->>'expires_at')::timestamptz, jsonb_array_length(photos),
    coalesce(payload->>'source', 'website'),
    payload->>'region', payload->>'vacancy_period', payload->>'applicant', payload->>'utm_content'
  ) returning id into new_id;
  for photo in select value from jsonb_array_elements(photos) loop
    ordinal := ordinal + 1;
    bytes := decode(photo->>'content', 'base64');
    if substring(bytes from 1 for 3) <> decode('ffd8ff', 'hex') then raise exception 'INVALID_JPEG'; end if;
    insert into public.application_photos(application_id, position, content, width, height)
      values(new_id, ordinal, bytes, (photo->>'width')::integer, (photo->>'height')::integer);
  end loop;
  return new_id;
end;
$$;
revoke all on function public.create_application_with_photos(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_application_with_photos(jsonb, jsonb) to service_role;
commit;
