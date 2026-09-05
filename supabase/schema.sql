-- 빈집이력서 — Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
-- 여러 번 실행해도 안전하다 (if not exists).

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
-- 신청 — 사람이 폼에 넣는 것
-- ─────────────────────────────────────────────
create table if not exists public.applications (
  id                uuid primary key default gen_random_uuid(),

  address           text not null,                 -- 입력 원문
  resolved_address  text,                          -- juso 가 정규화한 주소
  pnu               text,                          -- 19자리 필지고유번호
  match_quality     text check (match_quality in ('exact','road','fuzzy')),

  -- 소유주가 알려주는 것 (전부 선택)
  condition         text,                          -- 집 상태 한 줄
  acquisition       text,                          -- 취득 경위
  ownership         text,                          -- 소유관계
  concern           text,                          -- 가장 걱정되는 것 → 6경로 정렬 기준
  speed             text,                          -- 희망 소요

  -- 연락
  -- channel 은 '어느 쪽이 편하신가요' 선호 데이터라 비어 있을 수 있다.
  -- 진단서는 이메일로 보내므로 라우팅 결정이 아니다.
  channel           text,
  -- 전화번호와 이메일은 항상 받는다.
  -- 이메일은 진단서를 보낼 유일한 경로이고, 전화번호는 발송이 실패했을 때 닿을 수단이다.
  contact           text not null,
  email             text not null,

  created_at        timestamptz not null default now(),
  -- 발송 후 6개월 보관 뒤 파기. 화면 동의 문구에 약속한 값이다.
  expires_at        timestamptz not null default (now() + interval '6 months')
);

-- ─────────────────────────────────────────────
-- 진단서 — 자동 판정이 초안을 만들고 사람이 승인한다
-- 한 신청에 여러 버전이 남는다 ('이 정보가 틀렸어요' 대응)
-- ─────────────────────────────────────────────
create table if not exists public.reports (
  id                uuid primary key default gen_random_uuid(),
  application_id    uuid not null references public.applications(id) on delete cascade,
  version           int  not null default 1,

  -- draft  자동 판정 완료, 사람이 아직 안 봤다
  -- issued 사람이 승인해 사용자에게 나갔다
  -- failed 판정이 실패했다. 검토 화면에서 재실행한다
  status            text not null default 'draft'
                    check (status in ('draft','issued','failed')),

  verdict           text check (verdict in ('possible','conditional','blocked')),
  axes              jsonb,   -- 6항목 판정 근거
  paths             jsonb,   -- 6경로 + 정렬 결과
  note              text,    -- 운영자가 손으로 덧붙이는 말

  issued_at         timestamptz,
  created_at        timestamptz not null default now(),

  unique (application_id, version)
);

create index if not exists reports_application_id_idx on public.reports (application_id);
create index if not exists reports_status_idx         on public.reports (status);
create index if not exists applications_created_idx   on public.applications (created_at desc);
create index if not exists applications_expires_idx   on public.applications (expires_at);

-- ─────────────────────────────────────────────
-- 접근 제어
--
-- RLS 를 켜고 정책을 하나도 만들지 않는다.
-- anon·authenticated 키로는 아무것도 읽거나 쓸 수 없고,
-- 서버에서만 쓰는 service_role 키는 RLS 를 우회하므로 정상 동작한다.
-- 진단서에는 주소와 연락처가 담기므로 기본을 '전면 차단'으로 둔다.
-- ─────────────────────────────────────────────
alter table public.applications enable row level security;
alter table public.reports      enable row level security;

-- ─────────────────────────────────────────────
-- 보관 기간 이행
--
-- 6개월 파기는 화면에 한 약속이므로 실제로 지워져야 한다.
-- SQL Editor 에서 수동으로 실행하거나, pg_cron 이 있으면 예약한다.
--   select cron.schedule('purge-expired','0 4 * * *','select public.purge_expired()');
-- reports 는 on delete cascade 로 함께 정리된다.
-- ─────────────────────────────────────────────
create or replace function public.purge_expired()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.applications where expires_at < now();
  get diagnostics removed = row_count;
  return removed;
end;
$$;
