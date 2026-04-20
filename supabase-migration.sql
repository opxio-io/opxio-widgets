-- Opxio Client Portal — Supabase Migration
-- Run this in Supabase SQL Editor

-- Portal sessions table
create table if not exists portal_sessions (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  project_id text not null,
  contact_id text,
  email text,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  last_accessed timestamptz,
  unique (project_id)
);

-- Index for token lookups (hot path on every page load)
create index if not exists portal_sessions_token_idx on portal_sessions(token);
create index if not exists portal_sessions_email_idx on portal_sessions(email);
create index if not exists portal_sessions_project_idx on portal_sessions(project_id);

-- Login attempt rate limiting
create table if not exists portal_login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz default now()
);

create index if not exists portal_login_attempts_email_idx on portal_login_attempts(email);
create index if not exists portal_login_attempts_created_idx on portal_login_attempts(created_at);

-- Auto-clean old login attempts (keep last 24h only)
create or replace function clean_old_login_attempts()
returns void language sql as $$
  delete from portal_login_attempts where created_at < now() - interval '24 hours';
$$;

-- RLS: service role only (no public access)
alter table portal_sessions enable row level security;
alter table portal_login_attempts enable row level security;
