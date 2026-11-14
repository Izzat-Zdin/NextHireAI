# NextHire AI (Laravel + Inertia + React)

> **Starter untuk tim.** Repo ini ialah versi starter: UI semua page kekal, tetapi logic dan database modul ahli kumpulan sudah dikosongkan (`// TODO`). Mula dengan [docs/tugasan/PANDUAN-TIM.md](docs/tugasan/PANDUAN-TIM.md), kemudian buka fail tugasan anda dalam `docs/tugasan/`.


The same NextHire AI application as the React + Supabase project (`../SIAP`), rebuilt as **Laravel 12 + Inertia 2 + React 19**:

- **Laravel** owns routing, authentication (email/password, email verification, forgot/reset password, Google via Socialite), authorization (Policies, admin middleware), file storage and the JSON API.
- **Inertia** renders the React pages from Laravel routes, so there is one project and one deploy.
- **React + TypeScript + Tailwind v4 + shadcn/ui**: the UI is copied unchanged from `SIAP/src` (same pages, components, theme, dark mode, mobile bar).
- **Scoring engines stay in the browser** (resume analysis, answer evaluation, speech analysis, readiness, recommendation ranking). Laravel stores the results.
- **Database: the same Supabase Postgres project** and the same 12 ERD tables as the React app. Both apps can run against it at the same time.

```
Browser (React, same UI) ──Inertia / JSON──► Laravel (routes → controllers → Eloquent + Policies) ──pdo_pgsql──► Supabase Postgres (12 tables)
```

## Modules and owners

| # | Module | Owner | Folder (`resources/js/modules/`) | Routes |
|---|---|---|---|---|
| 1 | User Management & Authentication | Nada | `user-management/` | `/login`, `/register`, `/forgot-password`, `/reset-password/{token}`, `/profile` |
| 2 | AI Resume Analyzer | Shafinaz | `ai-resume-analyzer/` | `/resume`, `/resume/history`, `/resume/{id}` |
| 3 | AI Mock Interview Engine | Nada & Izzat | `mock-interview/` | `/interview`, `/interview/history`, `/interview/{id}` |
| 4 | Interview & Career Readiness Assessment | Izzat | `interview-readiness/` | `/assessment` |
| 5 | Learning Recommendation | Shafinaz & Wani | `learning-recommendation/` | `/learning`, `/learning/{id}` |
| 6 | Recommendation & Progress Tracking | Izzat | `recommendation-tracking/` | `/progress` |
| — | Dashboard | Izzat | `dashboard/` | `/` |
| A1 | Admin · User Management | Nada | `admin/user-management/` | `/admin/users`, `/admin/users/{id}` |
| A2 | Admin · Learning Resources | Wani | `admin/learning-resources/` | `/admin/resources` |

## What is where

| | Path |
|---|---|
| Pages, components, engines (copied from SIAP) | `resources/js/modules/**`, `resources/js/components/**`, `resources/js/lib/**` |
| Inertia bootstrap (providers + AppShell layout) | `resources/js/app.tsx` |
| React Router shim over Inertia (`Link`, `useNavigate`, `useParams`, …) | `resources/js/lib/router.tsx` |
| JSON client used by the module services | `resources/js/lib/api.ts` |
| Auth state from Inertia shared props (`useAuth()`) | `resources/js/modules/user-management/context/AuthContext.tsx` |
| Page routes + JSON API routes | `routes/web.php`, `routes/auth.php` |
| Controllers | `app/Http/Controllers/PageController.php` (pages), `app/Http/Controllers/Api/**` (data), `app/Http/Controllers/Auth/**` |
| Models (one per ERD table + the summary view) | `app/Models/**` |
| Policies (replace Supabase RLS) | `app/Policies/**` |
| Middleware: deactivated accounts, admin area | `app/Http/Middleware/EnsureUserIsActive.php`, `EnsureUserIsAdmin.php` |
| Shared Inertia props (user, route params, paused count, test accounts) | `app/Http/Middleware/HandleInertiaRequests.php` |
| App settings (email verification switch, test accounts, resume disk) | `config/nexthire.php` |
| One-time SQL for the Supabase project | `database/sql/20261110000001_laravel_auth.sql` |

## Setup

### 1. Prerequisites

- PHP 8.3 with `pdo_pgsql`, `mbstring`, `openssl`, `fileinfo`, `curl`, `zip`. In `php.ini` set `upload_max_filesize = 8M` and `post_max_size = 10M` so 5 MB resumes can be stored (PHP's default is 2 MB; a larger file is then saved without its download).
- Composer 2
- Node.js 20+ and pnpm
- The Supabase project used by the React app, with its four migrations already run (`SIAP/supabase/migrations`)

### 2. Database (once)

Open the Supabase SQL Editor for the project and run `database/sql/20261110000001_laravel_auth.sql`. It adds the Laravel auth columns to `public.users` (`password`, `remember_token`, `email_verified_at`, `google_id`, `avatar_url`), drops the FK to `auth.users`, and creates `password_reset_tokens` (with RLS enabled: only Laravel, connecting as the `postgres` role, reads it). If the editor asks "Run and enable RLS" vs "Run without RLS", either works because the file enables it itself. Existing rows and the React app keep working.

### 3. Configure `.env`

```bash
copy .env.example .env
```

```bash
php artisan key:generate
```

Then fill in:

```
# Supabase → Project Settings → Database → Connect → "Session pooler"
DB_HOST=aws-0-ap-northeast-2.pooler.supabase.com   (this project is in ap-northeast-2; copy the host shown in the dashboard)
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.<project-ref>
DB_PASSWORD=<database password>
DB_SSLMODE=require
```

> The direct host `db.<ref>.supabase.co` only has an IPv6 address; use the pooler host.

Optional:

```
AUTH_REQUIRE_EMAIL_VERIFICATION=false   # true = users must click the emailed link (like Supabase "Confirm email")
TEST_ACCOUNT_EMAIL= / TEST_ACCOUNT_PASSWORD=   # one-click "Continue as Ali Test" button (local only); the first click creates the account
TEST_ADMIN_EMAIL= / TEST_ADMIN_PASSWORD=       # same, with role admin
GOOGLE_CLIENT_ID= / GOOGLE_CLIENT_SECRET=     # Google login; add http://localhost:8000/auth/google/callback in Google Cloud Console
```

### 4. Install and run

```bash
composer install
```

```bash
pnpm install
```

Two processes during development (or `composer run dev`, which starts both plus the log tail):

```bash
php artisan serve
```

```bash
pnpm dev
```

Open http://localhost:8000.

### 5. Make yourself an admin

```sql
update public.users set role = 'admin' where email = 'you@example.com';
```

## Accounts and data from the React app

- **Passwords** live in Supabase Auth and cannot be copied. A user created in the React app signs in here once with **Forgot password** (or with Google, matched by email) and then has the same data. The test accounts are created or re-keyed automatically by the "Continue as …" buttons.
- **Resume files** uploaded through the React app sit in Supabase Storage; this app stores new uploads on its own private disk (`storage/app/private/resumes/<user_id>/`). "Download original" on an old report says so instead of downloading. Everything else (analyses, interviews, learning progress) is shared row for row.

## Verified end to end (10 Nov 2026, same Supabase project as the React app)

Login (email, test accounts), register, logout, wrong password, forgot/reset password (mail log), deactivated-account notice, dashboard, profile (edit name, change password, activity counts), resume upload with file → report → signed download → delete, mock interview (3 typed answers → report; questions, answers, attempts, evaluations, audio analyses and report rows written; pause/cancel/finish/delete rules), readiness, learning plan (save, update, remove, resource detail), progress, admin users (list, search, filters, stats, detail, activity, status, role, self-change refused) and admin resources CRUD. Google login needs your own client id/secret and was not exercised.

## Mock interview scoring (Module 3)

- The browser scores each answer instantly (`resources/js/modules/mock-interview/services/evaluation.ts`). The server **recomputes** the score from the saved answer text (`app/Services/Interview/AnswerEvaluator.php`) and stores only its own result, so a score sent from DevTools is ignored. The two files must stay identical in their rules: `php artisan test --filter=AnswerEvaluatorTest` fails when they drift.
- Very short answers, gibberish, keyword lists and one word repeated are capped (6/100 for "asdf qwer", 20 for a keyword list). Technical vocabulary follows the role (IT, data, marketing, finance, healthcare, teaching, engineering, design, HR/admin, customer service), in English and Malay.
- Each answer is saved as soon as it is submitted (`POST /api/interview/sessions/{id}/answers`). "End interview → Save and continue later" pauses the session; **Interview history → Continue** reopens it at the first unanswered question. A tab closed mid-interview leaves the session Active with its answers, and it can be continued the same way.
- A finished or discarded session cannot be changed (409). Answers are limited to 5,000 characters, and a user can start at most 20 sessions per hour.
- Filler words: Chrome's speech recognition drops "um" and "uh". Set `DEEPGRAM_API_KEY` (free credit at deepgram.com) to also send each spoken answer's audio to Deepgram with `filler_words=true`; the room then adds the hesitation sounds it hears to the filler count. The audio is not stored. Without the key nothing is recorded or sent. Malay "macam mana", "macam-macam", and "actually"/"basically" in the middle of a sentence are not counted as fillers.

## Speed notes

The database is in another AWS region, so every query is a ~0.4 s round trip. The app keeps one persistent TLS connection per PHP process, sends no `set` statements on connect, and PHP opcache should be on (`opcache.enable_cli=1` for `php artisan serve`). `php artisan serve` handles one request at a time on Windows; for parallel requests run the app under Laravel Octane or a real web server.

## Deploy to Vercel

Vercel has no built-in PHP, so the app runs on the community runtime [`vercel-php`](https://github.com/vercel-community/php) (PHP 8.4, `pdo_pgsql` included). What is already set up in the repo:

| File | What it does |
|---|---|
| `vercel.json` | PHP function `api/index.php` (runtime `vercel-php@0.9.0`, PHP 8.5) in region `icn1` (Seoul, next to the Supabase database). `public/` is the static output, and every other path is rewritten to the function. No install or build step runs on Vercel. |
| `api/index.php` | Boots Laravel. Sets the serverless defaults (cookie sessions, array cache, logs to stderr, caches and compiled views in `/tmp`), presents itself as `/index.php` so `/api/...` routes keep their prefix, restores a missing `base64:` on `APP_KEY`, and hides PHP deprecation notices. |
| `.vercelignore` | Keeps `vendor/`, `node_modules/`, `resources/js/`, local storage and `public/index.php` out of the upload (otherwise Vercel would serve that file's source at `/`). Vercel runs `composer install` itself. |
| `public/build/` | **Committed** Vite build. Vercel serves it as static files and Laravel reads its manifest. |
| `bootstrap/app.php` | Trusts the proxy headers, so links and redirects use `https`. |

### Every time the frontend changes

Vercel does not run `pnpm build`. Rebuild and commit the assets before pushing, or the live site keeps the old UI:

```bash
pnpm build
```

```bash
git add public/build
```

### First deploy

1. Vercel → **Add New → Project** → import `Izzat-Zdin/FullNextHireAI-Laravel`. Leave Framework Preset as **Other** and the build settings empty: `vercel.json` decides.
2. Before clicking **Deploy**, open **Environment Variables** and paste the app's values. A ready-made file is `.env.vercel` (local only, never committed). Without it, set at least: `APP_KEY` (`php artisan key:generate --show`), `APP_URL`, the `DB_*` values from `.env`, and optionally `TEST_ACCOUNTS_IN_PRODUCTION=true` with `TEST_ACCOUNT_*`.
3. Deploy. If the URL Vercel gives differs from `APP_URL`, update `APP_URL` (and `GOOGLE_REDIRECT_URI`) and redeploy.
4. Environment variable changes only apply after **Deployments → ⋯ → Redeploy**.

Live: https://www.nexthire.web.id (custom domain from SumoPod; `nexthire.web.id` redirects to `www`). Vercel URL: https://full-next-hire-ai-laravel.vercel.app

Custom domain DNS (at the registrar): `A` record `@` → `216.198.79.1`, and `CNAME` `www` → the value Vercel shows under Settings → Domains. TTL 1 hour is fine.

### What behaves differently on Vercel

- **Resume files.** The function's disk is read-only and temporary. Without extra setup, an analysis is saved with the warning "the original file could not be stored", and "Download original" is unavailable. To keep files, create Supabase S3 access keys and set `RESUME_DISK=supabase`, `RESUME_FOLDER=` (empty) and the `SUPABASE_S3_*` values. Files then go to the existing `resumes` bucket as `<user_id>/<file>`, the same layout as the React app, so its older uploads download here too. This path is not yet tested against Supabase.
- **Emails.** `MAIL_MAILER` defaults to `log`, so password-reset links are not delivered. Set SMTP values (Gmail app password, Resend, Brevo…).
- **Login rate limiting** uses the in-memory cache, so it resets between requests.
- **Microphone and camera** need HTTPS, which Vercel provides. Speech-to-text works in Chrome and Edge.
- **Google login.** Add `<APP_URL>/auth/google/callback` to the OAuth client in Google Cloud Console.

## Scripts

| Command | What it does |
|---|---|
| `php artisan serve` | Laravel dev server on port 8000 |
| `pnpm dev` | Vite dev server (hot reload) |
| `pnpm typecheck` | TypeScript check |
| `pnpm build` | Typecheck + production build into `public/build` |
| `php artisan route:list --except-vendor` | Every page and API route |
| `php artisan test` | Backend tests |
