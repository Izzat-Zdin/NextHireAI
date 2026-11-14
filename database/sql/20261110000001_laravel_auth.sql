-- =====================================================================
-- NextHire AI (Laravel + Inertia + React edition)
-- Run ONCE in the Supabase SQL Editor of the SAME project the React app uses,
-- AFTER the four migrations in SIAP/supabase/migrations (the 12 ERD tables).
--
-- What this does:
--   * public.users no longer depends on Supabase Auth (auth.users): Laravel
--     keeps the password itself (hashed) and generates user_id.
--   * adds the columns Laravel auth needs: password, remember_token,
--     email_verified_at, google_id, avatar_url.
--   * adds password_reset_tokens (Laravel "forgot password").
--   * existing rows keep working. Users created by the React app have no
--     Laravel password yet: they use "Forgot password" once, or sign in
--     with Google (matched by email).
--   * the React app keeps working: it still signs in through Supabase Auth
--     and reads the same rows. The RLS policies are untouched; Laravel
--     connects as the postgres role, which bypasses RLS, so ownership is
--     enforced by Laravel Policies instead.
-- =====================================================================

begin;

alter table public.users drop constraint if exists users_user_id_fkey;
alter table public.users alter column user_id set default gen_random_uuid();

alter table public.users
  add column if not exists password          text,
  add column if not exists remember_token    varchar(100),
  add column if not exists email_verified_at timestamptz,
  add column if not exists google_id         text,
  add column if not exists avatar_url        text;

create unique index if not exists users_google_id_key on public.users (google_id) where google_id is not null;

create table if not exists public.password_reset_tokens (
  email      text primary key,
  token      text not null,
  created_at timestamptz
);

-- Only Laravel (postgres role, table owner) touches this table; keep the anon/authenticated
-- API keys of the React app away from the reset tokens.
alter table public.password_reset_tokens enable row level security;

commit;
