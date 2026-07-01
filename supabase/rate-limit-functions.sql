-- ============================================================
-- StockPulse — Login rate limiting
-- ============================================================
--
-- Tracks failed login attempts per identifier (either "ip:<addr>" or
-- "user:<username>") so the login route can throttle brute-force
-- attempts independently by source IP and by target account.

create table if not exists public.login_attempts (
  id uuid primary key default uuid_generate_v4(),
  identifier text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_login_attempts_identifier_created_at
  on public.login_attempts (identifier, created_at desc);

-- Counts failed attempts for an identifier within the trailing window.
-- Read-only: does not record anything, safe to call before a login
-- attempt is even validated.
create or replace function public.count_recent_login_attempts(
    p_identifier text,
    p_window_seconds integer
)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from public.login_attempts
  where identifier = p_identifier
    and created_at >= now() - (p_window_seconds || ' seconds')::interval;
$$;

-- Records a single failed login attempt for an identifier, and prunes
-- that identifier's own rows older than p_prune_window_seconds so the
-- table doesn't grow unbounded (default: 1 hour, well past any
-- realistic rate-limit window).
create or replace function public.record_failed_login_attempt(
    p_identifier text,
    p_prune_window_seconds integer default 3600
)
returns void
language plpgsql
as $$
begin
    delete from public.login_attempts
    where identifier = p_identifier
      and created_at < now() - (p_prune_window_seconds || ' seconds')::interval;

    insert into public.login_attempts (identifier)
    values (p_identifier);
end;
$$;

-- ============================================================
-- Refresh PostgREST schema cache
-- ============================================================

notify pgrst, 'reload schema';
