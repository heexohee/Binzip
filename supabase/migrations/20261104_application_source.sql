-- Where a diagnosis application came from (allowed utm_source labels only). Apply before relying on source metrics;
-- the app keeps saving applications without it until then.
begin;
alter table public.applications
  add column if not exists source text not null default 'website'
    check (source in ('instagram', 'facebook', 'meta', 'moast', 'family-share', 'website'));

-- Photo submissions go through this function, so it must write the new column too.
create or replace function public.create_application_with_photos(payload jsonb, photos jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare new_id uuid; photo jsonb; ordinal integer := 0; bytes bytea;
begin
  if jsonb_typeof(photos) is distinct from 'array' then raise exception 'INVALID_PHOTOS'; end if;
  if jsonb_array_length(photos) not between 1 and 6 then raise exception 'INVALID_PHOTO_COUNT'; end if;
  insert into public.applications (
    address, resolved_address, pnu, match_quality, condition, acquisition, ownership,
    concern, speed, channel, contact, email, created_at, expires_at, photo_count, source
  ) values (
    payload->>'address', payload->>'resolved_address', payload->>'pnu', payload->>'match_quality',
    payload->>'condition', payload->>'acquisition', payload->>'ownership', payload->>'concern',
    payload->>'speed', payload->>'channel', payload->>'contact', payload->>'email',
    (payload->>'created_at')::timestamptz, (payload->>'expires_at')::timestamptz, jsonb_array_length(photos),
    coalesce(payload->>'source', 'website')
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
