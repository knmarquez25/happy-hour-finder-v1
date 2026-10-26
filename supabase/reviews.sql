-- Run once in a dedicated Supabase Free project. Contains no secret values.
create table if not exists public.review_candidates (
  id uuid primary key default gen_random_uuid(),
  candidate_key text not null unique check (length(candidate_key) between 1 and 300),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  payload jsonb not null check (octet_length(payload::text) <= 20000),
  approved_payload jsonb check (octet_length(approved_payload::text) <= 20000),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  constraint review_snapshot check (
    (status='pending' and approved_payload is null and reviewed_at is null and reviewed_by is null) or
    (status='approved' and approved_payload is not null and reviewed_at is not null and reviewed_by is not null) or
    (status='rejected' and approved_payload is null and reviewed_at is not null and reviewed_by is not null)
  )
);
create table if not exists public.review_evidence (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.review_candidates(id),
  source_url text not null check (length(source_url) between 8 and 2048),
  note text not null check (length(note) between 1 and 750),
  created_at timestamptz not null default now()
);
create index if not exists review_evidence_candidate on public.review_evidence(candidate_id);
alter table public.review_candidates enable row level security;
alter table public.review_evidence enable row level security;
-- All public database operations are denied. Only the private Render service role
-- uses these tables, after rate limits and owner-token validation for decisions.
revoke all on public.review_candidates, public.review_evidence from anon, authenticated;
grant select, insert, update on public.review_candidates to service_role;
grant select, insert on public.review_evidence to service_role;

-- Persist unverified menu previews separately from immutable discovery/approval data.
-- Safe to rerun on an existing project; changes no grants or review status.
alter table public.review_candidates add column if not exists menu_lookup jsonb
  check (octet_length(menu_lookup::text) <= 20000);
