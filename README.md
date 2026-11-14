# NextHire AI — Team Starter

Laravel 12 + Inertia + React 19, database on Supabase (PostgreSQL).

Every page is already built. Izzat's modules and login/register work. **Your module's logic has been replaced with `// TODO (YourName)` notes** — fill them in so it works like the finished system: https://www.nexthire.web.id

---

## 1. Install the tools (once)

| Tool | Download |
|---|---|
| Git | https://git-scm.com/downloads |
| VS Code | https://code.visualstudio.com |
| PHP 8.3 | https://windows.php.net/download (VS16 x64 Non Thread Safe zip) |
| Composer | https://getcomposer.org/download |
| Node.js 20+ (LTS) | https://nodejs.org |
| pnpm | after Node.js, run `npm install -g pnpm` |

Then turn on the PHP database driver: run `php --ini`, open the `php.ini` it shows (if it says *none*, copy `php.ini-development` in the PHP folder and rename it `php.ini`), remove the `;` in front of these lines and save:

```ini
extension_dir = "ext"
extension=curl
extension=fileinfo
extension=mbstring
extension=openssl
extension=pdo_pgsql
extension=pgsql
extension=zip
```

Reopen the terminal and check: `php -v` shows 8.3, and `php -m` lists `pdo_pgsql`.

## The `.env` file (read this first)

**What it is:** a small settings file that tells the app *where the database is and how to log in to it* (database address and password), plus the **Test user / Test admin** accounts and the app key. Without it the app cannot reach the Supabase database, so pages show errors and the Test buttons are missing.

**Why it is not on GitHub:** it contains the database password. This repository is public, so the file is listed in `.gitignore` and never uploaded. GitHub only has `.env.example` (the same settings without the secrets).

**How to get it:** Izzat sends it to you **privately** (WhatsApp). Save it in your **Downloads** folder and name it **`env-untuk-tim.env`**. The command in section 2 copies it into the project for you.

**If you add it by hand instead:** put it in the `NextHireAI` folder (next to `README.md`) and rename it to exactly **`.env`**, then run `php artisan key:generate`. In Windows File Explorer turn on **View → Show → File name extensions**, so the file is not secretly named `.env.txt`.

```
NextHireAI/
├── app/
├── resources/
├── .env            ← here (from Izzat)
├── .env.example    ← already in the repo, don't edit
└── README.md
```

**Rules:** never commit it, never post it in a group chat or screenshot, and don't change the database values. If the database password changes, Izzat sends you a new file.

## 2. Get the code and run it (first time)

1. Save the **`.env` file from Izzat** in your **Downloads** folder as `env-untuk-tim.env` (see the section above).
2. Open PowerShell (or the VS Code terminal), replace `your-branch` and run:

```powershell
git clone https://github.com/Izzat-Zdin/NextHireAI.git; cd NextHireAI; git checkout your-branch; copy "$HOME\Downloads\env-untuk-tim.env" .env; composer install; pnpm install; php artisan key:generate; npx -y concurrently "php artisan serve" "pnpm dev"
```

3. Open **http://localhost:8000** and click **Test user** (or **Test admin** for admin pages). Stop with `Ctrl + C`.

| Member | `your-branch` | Your task file |
|---|---|---|
| Nada | `nada/user-management` | [docs/tugasan/TUGASAN-NADA.md](docs/tugasan/TUGASAN-NADA.md) |
| Shafinaz | `shafinaz/resume-analyzer` | [docs/tugasan/TUGASAN-SHAFINAZ.md](docs/tugasan/TUGASAN-SHAFINAZ.md) |
| Shafinaz & Wani | `shafinaz-wani/learning` | [docs/tugasan/TUGASAN-SHAFINAZ-WANI.md](docs/tugasan/TUGASAN-SHAFINAZ-WANI.md) |
| Wani | `wani/admin-resources` | [docs/tugasan/TUGASAN-WANI.md](docs/tugasan/TUGASAN-WANI.md) |

## 3. Run it again (every next time)

```powershell
cd NextHireAI; git pull; npx -y concurrently "php artisan serve" "pnpm dev"
```

## Problems?

| You see | Fix |
|---|---|
| `'php' is not recognized` (or composer / node / pnpm) | Close and reopen the terminal; reinstall the tool with "Add to PATH" if it still fails |
| `could not find driver` | `pdo_pgsql` is off — redo the `php.ini` step in section 1 |
| Blank page or `Vite manifest not found` | The React dev server is not running — use the full `npx -y concurrently ...` command |
| No **Test user** button / database errors | The `.env` file is missing or wrong — get the latest one from Izzat |
| Port 8000 already in use | Stop the other app, or run `php artisan serve --port=8001` |

---

## Modules and owners

✅ finished · ⏳ has TODOs for the owner

| # | Module | Owner | Branch | Status |
|---|---|---|---|---|
| M1 | User Management — login, register, logout | — | `main` | ✅ |
| M1 | User Management — profile, forgot / reset password | Nada | `nada/user-management` | ⏳ |
| M2 | AI Resume Analyzer | Shafinaz | `shafinaz/resume-analyzer` | ⏳ |
| M3 | AI Mock Interview Engine | Nada & Izzat | `main` | ✅ |
| M4 | Interview & Career Readiness | Izzat | `main` | ✅ |
| M5 | Learning Recommendation | Shafinaz & Wani | `shafinaz-wani/learning` | ⏳ |
| M6 | Progress Tracking (hidden from the sidebar) | Izzat | `main` | ✅ |
| — | Dashboard | Izzat | `main` | ✅ |
| A1 | Admin · User Management | Nada | `nada/user-management` | ⏳ |
| A2 | Admin · Learning Resources | Wani | `wani/admin-resources` | ⏳ |

## Where the code is

Each module has a **frontend folder** (React pages, components, services) and **backend files** (Laravel controller, model).

| # | Frontend: `resources/js/modules/` | Backend: `app/` |
|---|---|---|
| M1 | `m1-user-management/` | `Http/Controllers/Auth/*`, `Http/Controllers/Api/ProfileController.php`, `Models/User.php` |
| M2 | `m2-ai-resume-analyzer/` | `Http/Controllers/Api/ResumeController.php`, `Models/Resume.php`, `Policies/ResumePolicy.php` |
| M3 | `m3-mock-interview/` | `Http/Controllers/Api/InterviewSessionController.php`, `Services/Interview/*`, `Models/Interview*.php` |
| M4 | `m4-interview-readiness/` | — (reads M2, M3 and M5 data) |
| M5 | `m5-learning-recommendation/` | `Http/Controllers/Api/LearningController.php`, `Models/LearningProgress.php` |
| M6 | `m6-recommendation-tracking/` | — (reads M2, M3 and M5 data) |
| — | `dashboard/` | — |
| A1 | `admin/a1-user-management/` | `Http/Controllers/Api/Admin/UserController.php` |
| A2 | `admin/a2-learning-resources/` | `Http/Controllers/Api/Admin/ResourceController.php`, `Models/LearningResource.php` |

Inside every frontend folder: `pages/` (screens, finished) · `components/` (UI parts, finished) · `services/` (**your TODOs**: talks to the API).

Shared, don't change: `routes/web.php` (all routes) · `resources/js/lib/` (API client, types) · `resources/js/components/` (sidebar, buttons, cards).

Data flow: **page → service (.ts) → route → controller → model → database → JSON back to the page.**

## Database (Supabase PostgreSQL)

| Table | What it stores | Module (owner) |
|---|---|---|
| `users` | Accounts: name, email, password, role (user/admin), status | M1, A1 (Nada) |
| `password_reset_tokens` | Forgot-password tokens | M1 (Nada) |
| `resume` | Uploaded resumes and their analysis (score, skills, target role) | M2 (Shafinaz) |
| `interview_sessions` | One mock interview (role, type, language, status) | M3 (Izzat) |
| `interview_questions` | Questions asked in a session | M3 |
| `interview_answers` | The candidate's answers | M3 |
| `answer_attempts` | Attempt number of each answer | M3 |
| `answer_evaluations` | Score and feedback per answer | M3 |
| `audio_analyses` | Speaking rate, filler words, pauses | M3 |
| `facial_analyses` | Camera analysis (table ready, not used yet) | M3 |
| `reports` | Interview report summary | M3 |
| `learning_resources` | Course / video / article catalogue | A2 (Wani) |
| `learning_progress` | Each user's learning plan and progress | M5 (Shafinaz & Wani) |
| `interview_session_summaries` | **View** (read-only): score and counts per session | M3 |

M4 Readiness, M6 Progress and the Dashboard only **read** these tables. Exact columns for your tables are in your task file.

---

## Doing your module

1. In VS Code press **Ctrl + Shift + F** and search `TODO (YourName)`.
2. Read your **task file** (table above): it lists the files to fill in, the database tables, the API and a ready **🤖 AI prompt**.
3. Copy the pattern from Izzat's finished module: `app/Http/Controllers/Api/InterviewSessionController.php` and `resources/js/modules/m3-mock-interview/services/interviewService.ts`.
4. Check before you push: `pnpm typecheck`.

**Rules**
- Only edit the files in your task file. Don't rename files, functions, routes or `types.ts`, and don't change the UI.
- ⚠️ **Never run `php artisan migrate`, `migrate:fresh` or `db:wipe`** — the shared database is the live one.
- Never commit `.env`.

**Save and hand in**

```powershell
git add .; git commit -m "M2: ResumeController index"; git push
```

If you changed React files, run `pnpm build` first and commit `public/build` (the Vercel preview uses it). When your module is done, open a **Pull Request** into `main` on GitHub; Izzat reviews and merges it.

---

More: [docs/tugasan/PANDUAN-TIM.md](docs/tugasan/PANDUAN-TIM.md) (team guide, Malay) · [docs/PROJECT.md](docs/PROJECT.md) (folder map by module and full technical details)
