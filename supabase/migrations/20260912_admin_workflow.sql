-- Internal workflow only; does not publish reports or mark field/registry checks complete.
alter table public.applications
  add column if not exists review_status text not null default 'received'
    check (review_status in ('received', 'reviewing', 'waiting', 'completed')),
  add column if not exists internal_note text check (char_length(internal_note) <= 5000),
  add column if not exists review_updated_at timestamptz;

-- Existing applications RLS and expiry/cascade deletion also cover these columns.
