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

## 2. Get the code and run it (first time)

1. Save the **`.env` file Izzat sends you** in your **Downloads** folder as `env-untuk-tim.env` (it has the database password, never share or commit it).
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
