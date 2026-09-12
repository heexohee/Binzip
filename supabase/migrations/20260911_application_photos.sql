-- Optional small photos for the MVP. Apply once before enabling production uploads.
-- Bytes live beside the application so existing retention/deletion also deletes photos.
begin;
alter table public.applications add column if not exists photo_count integer not null default 0 check (photo_count between 0 and 6);

create table if not exists public.application_photos (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  position integer not null check (position between 1 and 6),
  content bytea not null check (octet_length(content) between 1 and 524288),
  width integer not null check (width between 1 and 1600),
  height integer not null check (height between 1 and 1600),
  created_at timestamptz not null default now(),
  unique (application_id, position)
);
alter table public.application_photos enable row level security;
revoke all on public.application_photos from anon, authenticated;
grant all on public.application_photos to service_role;

create or replace function public.create_application_with_photos(payload jsonb, photos jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare new_id uuid; photo jsonb; ordinal integer := 0; bytes bytea;
begin
  if jsonb_typeof(photos) is distinct from 'array' then raise exception 'INVALID_PHOTOS'; end if;
  if jsonb_array_length(photos) not between 1 and 6 then raise exception 'INVALID_PHOTO_COUNT'; end if;
  insert into public.applications (
    address, resolved_address, pnu, match_quality, condition, acquisition, ownership,
    concern, speed, channel, contact, email, created_at, expires_at, photo_count
  ) values (
    payload->>'address', payload->>'resolved_address', payload->>'pnu', payload->>'match_quality',
    payload->>'condition', payload->>'acquisition', payload->>'ownership', payload->>'concern',
    payload->>'speed', payload->>'channel', payload->>'contact', payload->>'email',
    (payload->>'created_at')::timestamptz, (payload->>'expires_at')::timestamptz, jsonb_array_length(photos)
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
