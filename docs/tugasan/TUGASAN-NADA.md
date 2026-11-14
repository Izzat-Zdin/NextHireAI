# Tugasan Nada — M1 User Management (Profile, Forgot/Reset Password) + A1 Admin User Management

Baca [PANDUAN-TIM.md](PANDUAN-TIM.md) dahulu untuk setup.

## 1. Modul & owner

| Modul | Bahagian yang anda bina | Owner |
|---|---|---|
| M1 User Management | **Profile** (lihat/ubah nama, tukar kata laluan), **Forgot password**, **Reset password** | Nada |
| A1 Admin User Management | Senarai pengguna, statistik, detail + aktiviti, tukar status/role | Nada |

> **PENTING:** Login, register, logout, Google login, test-account login dan email verification **sudah berfungsi**. Jangan ubah fail-fail itu (`AuthenticatedSessionController`, `RegisteredUserController`, `GoogleController`, `VerifyEmail*`, `LoginRequest`, middleware `EnsureUserIsActive` / `EnsureUserIsAdmin`, model `User`, `AuthContext.tsx`). Semua ahli kumpulan bergantung pada fail ini untuk masuk ke sistem.

## 2. Fail yang sudah siap (jangan ubah)

| Jenis | Fail |
|---|---|
| Pages | `resources/js/modules/m1-user-management/pages/ProfilePage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx` |
| Pages admin | `resources/js/modules/admin/a1-user-management/pages/AdminUsersPage.tsx`, `AdminUserDetailPage.tsx` |
| Components | `resources/js/modules/admin/a1-user-management/components/UserStatusBadge.tsx`, `resources/js/modules/m1-user-management/components/AuthLayout.tsx` |
| Context | `resources/js/modules/m1-user-management/context/AuthContext.tsx` |
| Types | `resources/js/lib/types.ts` (`UserProfile`, `UserRole`, `UserStatus`, `InterviewSessionSummary`) |
| Helper API | `resources/js/lib/api.ts` (`api.get/put/patch/getOrNull`, `qs`, `ApiError`) |
| Routes | `routes/web.php` (blok `// Module 1` dan `// Admin`), `routes/auth.php` (`forgot-password`, `reset-password`) |
| Model | `app/Models/User.php` (termasuk `toProfileArray()`) |
| Bahagian yang dikekalkan dalam fail anda | `PasswordResetLinkController@create`, `NewPasswordController@create` (papar page), dan dalam `authService.ts`: `signUp`, `signIn`, `signInAsTestAccount`, `signInWithGoogle`, `signOut`, `post()`, `friendlyAuthError`, `passwordStrength`, test accounts |

## 3. Fail yang perlu diisi (checklist)

Setiap fungsi ada komen `// TODO (Nada): ...` yang menerangkan langkah tepat kod asal.

**Backend — `app/Http/Controllers/Api/ProfileController.php`**
- ☐ `ProfileController@show` — pulangkan `toProfileArray()` pengguna yang log masuk.
- ☐ `ProfileController@update` — validate `full_name` (1–120 aksara), buang ruang berganda, simpan, pulangkan profil terkini.
- ☐ `ProfileController@updatePassword` — validate `password` (min 8, confirmed), simpan, pulangkan `{ "ok": true }`.

**Backend — `app/Http/Controllers/Auth/PasswordResetLinkController.php`**
- ☐ `PasswordResetLinkController@store` — validate emel, `Password::sendResetLink`, redirect back dengan status neutral.

**Backend — `app/Http/Controllers/Auth/NewPasswordController.php`**
- ☐ `NewPasswordController@store` — validate token/email/password, `Password::reset`, redirect ke `/login` atau lempar ralat validation.

**Backend — `app/Http/Controllers/Api/Admin/UserController.php`**
- ☐ `UserController@index` — carian (`ilike` pada nama/emel), penapis role/status, paging, susun `created_at` terbaru dahulu.
- ☐ `UserController@stats` — 5 kiraan: total, active, inactive, admins, newThisWeek.
- ☐ `UserController@show` — pulangkan seorang pengguna.
- ☐ `UserController@activity` — ringkasan resume, temuduga, pembelajaran + 8 sesi terkini.
- ☐ `UserController@updateStatus` — tukar status; admin tidak boleh tukar status sendiri.
- ☐ `UserController@updateRole` — tukar role; admin tidak boleh tukar role sendiri.
- ☐ tambah semula `private const RECENT_SESSIONS = 8;` dan `private function guardSelf(...)`.

**Frontend — `resources/js/modules/m1-user-management/services/profileService.ts`**
- ☐ `getProfile` — `GET /api/profile`.
- ☐ `ensureProfile` — `GET /api/profile` (baris users dicipta semasa register).
- ☐ `updateProfile` — `PUT /api/profile` dengan `{ full_name }`.

**Frontend — `resources/js/modules/m1-user-management/services/authService.ts`** (hanya 3 fungsi ini)
- ☐ `sendPasswordReset` — Inertia `post("/forgot-password", { email })`.
- ☐ `updatePassword` — `PUT /api/profile/password` dengan `{ password, password_confirmation }`, ralat melalui `friendlyAuthError`.
- ☐ `resetPassword` — Inertia `post("/reset-password", { token, email, password, password_confirmation })`.

**Frontend — `resources/js/modules/admin/a1-user-management/services/adminUserService.ts`**
- ☐ `escapeSearch` — `raw.replace(/\s+/g, " ").trim()`.
- ☐ `listUsers` — `GET /api/admin/users?search&role&status&page&pageSize` (`"all"` → `""`).
- ☐ `getUserStats` — `GET /api/admin/users/stats`.
- ☐ `getUser` — `api.getOrNull` (404 → `null`).
- ☐ `getUserActivity` — `GET /api/admin/users/{id}/activity`.
- ☐ `setStatus` / `setRole` — `PATCH .../status` dan `PATCH .../role`.

**Database**
- ☐ Migration `users` dan `password_reset_tokens` dalam `database/migrations/` (lihat bahagian 4).

## 4. Database

Jadual ini **sudah wujud** dalam database Supabase yang dikongsi (anda boleh terus uji). Tetapi anda mesti tulis **Laravel migrations** dalam `database/migrations/` yang mencipta semula jadual ini dengan tepat, supaya database local yang baharu (`php artisan migrate`) sama seperti Supabase. (Folder `database/migrations` belum ada — cipta sendiri.)

### Jadual `users`

| Kolum | Jenis (Postgres) | Null | Default | Kunci / constraint |
|---|---|---|---|---|
| `user_id` | `uuid` | NO | `gen_random_uuid()` | **PRIMARY KEY** (`users_pkey`) |
| `full_name` | `text` | NO | `''` | |
| `email` | `text` | NO | — | **UNIQUE** (`users_email_key`) |
| `role` | `text` | NO | `'user'` | CHECK `role IN ('user','admin')` (`users_role_check`) |
| `status` | `text` | NO | `'active'` | CHECK `status IN ('active','inactive')` (`users_status_check`) |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | YES | — | |
| `password` | `text` | YES | — | (null untuk akaun Google sahaja) |
| `remember_token` | `varchar(100)` | YES | — | |
| `email_verified_at` | `timestamptz` | YES | — | |
| `google_id` | `text` | YES | — | UNIQUE separa: `users_google_id_key ON users (google_id) WHERE google_id IS NOT NULL` |
| `avatar_url` | `text` | YES | — | |

Nota:
- Jadual lain merujuk `users.user_id` dengan `ON DELETE CASCADE`: `resume.user_id`, `interview_sessions.user_id`, `learning_progress.user_id` (migration jadual itu milik modul lain).
- Supabase juga ada trigger lama `users_protect_columns` (BEFORE UPDATE) yang menghalang `user_id`, `email`, `created_at` diubah dan menghalang admin menukar role/status sendiri. **Tidak perlu** dibuat dalam migration — peraturan "admin tidak boleh ubah diri sendiri" kini dibuat dalam `UserController::guardSelf()`.
- Contoh migration (gunakan `DB::statement` untuk default/CHECK/indeks separa yang tiada dalam Blueprint):

```php
Schema::create('users', function (Blueprint $table) {
    $table->uuid('user_id')->primary()->default(DB::raw('gen_random_uuid()'));
    $table->text('full_name')->default('');
    $table->text('email')->unique('users_email_key');
    $table->text('role')->default('user');
    $table->text('status')->default('active');
    $table->timestampTz('created_at')->useCurrent();
    $table->timestampTz('updated_at')->nullable();
    $table->text('password')->nullable();
    $table->string('remember_token', 100)->nullable();
    $table->timestampTz('email_verified_at')->nullable();
    $table->text('google_id')->nullable();
    $table->text('avatar_url')->nullable();
});
DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user','admin'))");
DB::statement("ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active','inactive'))");
DB::statement('CREATE UNIQUE INDEX users_google_id_key ON users (google_id) WHERE google_id IS NOT NULL');
```

### Jadual `password_reset_tokens`

| Kolum | Jenis | Null | Default | Kunci / constraint |
|---|---|---|---|---|
| `email` | `text` | NO | — | **PRIMARY KEY** (`password_reset_tokens_pkey`) |
| `token` | `text` | NO | — | (token disimpan dalam bentuk hash oleh Laravel) |
| `created_at` | `timestamptz` | YES | — | |

Laravel password broker (`config/auth.php`): jadual `password_reset_tokens`, token tamat selepas **60 minit**, throttle **60 saat** antara permintaan.

## 5. API

Semua route API di bawah berada dalam kumpulan middleware `auth`, `active`, `verified` (mesti log masuk, akaun aktif). Route admin juga ada middleware `admin` (role `admin` **dan** status `active`; jika tidak → `403 { "message": "Administrators only." }`). Ralat validation Laravel sentiasa `422 { "message": "...", "errors": { "field": ["..."] } }`.

### M1 Profile

**`GET /api/profile`** — pengguna log masuk.
Output 200:
```json
{ "user_id": "6f1c…-uuid", "full_name": "Ali Test", "email": "ali@example.com", "status": "active", "role": "user",
  "created_at": "2026-01-05T08:00:00.000000Z", "updated_at": "2026-02-01T10:00:00.000000Z", "avatar_url": null, "google_id": null }
```

**`PUT /api/profile`** — pengguna log masuk. Input `{ "full_name": "Ali  bin  Abu " }`.
Validation: `full_name` → `required|string|min:1|max:120`. Nama dibersihkan: `trim(preg_replace('/\s+/', ' ', ...))` → `"Ali bin Abu"`. Set `updated_at = now()`. Hanya `full_name` diubah.
Output 200: objek profil (sama bentuk seperti di atas). Ralat: 422.

**`PUT /api/profile/password`** — pengguna log masuk. Input `{ "password": "...", "password_confirmation": "..." }`.
Validation: `password` → `required`, `confirmed`, `Rules\Password::min(8)`. Simpan dengan `forceFill(['password' => ...])->save()` (cast `hashed` dalam model akan hash).
Output 200: `{ "ok": true }`. Ralat 422, cth `"The password field must be at least 8 characters."`, `"The password field confirmation does not match."`.

### M1 Forgot / Reset password (Inertia form, bukan JSON — middleware `guest`)

**`POST /forgot-password`** — tetamu sahaja. Input `{ "email": "..." }`. Validation `email` → `required|email`.
`Password::sendResetLink($request->only('email'))`, kemudian **sentiasa** `back()->with('status', 'A reset link will be sent if the account exists.')` (jangan dedahkan emel wujud atau tidak). Page membaca `status` sebagai prop.

**`GET /reset-password/{token}?email=...`** — sudah siap (papar page dengan prop `email`, `token`).

**`POST /reset-password`** — tetamu sahaja. Input `{ "token", "email", "password", "password_confirmation" }`.
Validation: `token` → `required`; `email` → `required|email`; `password` → `required`, `confirmed`, `Rules\Password::min(8)`.
`Password::reset(...)` dengan callback yang set `password = Hash::make(...)`, `remember_token = Str::random(60)`, `save()`, `event(new PasswordReset($user))`.
Berjaya → redirect ke `/login` dengan flash `status` = `"Your password has been reset."`.
Gagal → `ValidationException::withMessages(['email' => [__($status)]])`, cth `"This password reset token is invalid."`, `"We can't find a user with that email address."`, `"Please wait before retrying."`.

### A1 Admin Users (middleware `admin`)

**`GET /api/admin/users?search=&role=&status=&page=1&pageSize=20`**
- `page` = max(1, page); `pageSize` = antara 1 dan 100 (default 20).
- `search` (trim): `full_name ILIKE %search%` **ATAU** `email ILIKE %search%` (escape `%`, `_`, `\` dengan `addcslashes`).
- `role` hanya ditapis jika `user`/`admin`; `status` hanya jika `active`/`inactive`; nilai lain diabaikan.
- Susun `created_at DESC`, `forPage(page, pageSize)`, setiap baris `toProfileArray()`.
Output 200:
```json
{ "rows": [ { "user_id": "…", "full_name": "Ali Test", "email": "ali@example.com", "status": "active", "role": "user",
              "created_at": "…", "updated_at": null, "avatar_url": null, "google_id": null } ],
  "total": 42, "page": 1, "pageSize": 20 }
```

**`GET /api/admin/users/stats`** → 200 `{ "total": 42, "active": 40, "inactive": 2, "admins": 3, "newThisWeek": 5 }` (`newThisWeek` = `created_at >= now() - 7 hari`).

**`GET /api/admin/users/{user}`** → 200 objek profil. `{user}` mesti UUID (route pattern) — id salah/tiada → 404.

**`GET /api/admin/users/{user}/activity`** → 200:
```json
{
  "resumes":    { "count": 3, "latestScore": 78, "latestAt": "2026-03-01T09:00:00.000000Z" },
  "interviews": { "total": 5, "finished": 4, "averageScore": 71, "latestAt": "2026-03-02T11:00:00.000000Z" },
  "learning":   { "completed": 2, "inProgress": 1, "notStarted": 4 },
  "recentSessions": [ /* hingga 8 baris InterviewSessionSummary, terbaru dahulu */ ]
}
```
- `resumes.latestScore` = `round(overall_score)` resume dengan `analyzed_at` terbaru (atau `null`).
- `interviews`: ambil hingga 500 baris `InterviewSessionSummary` (VIEW) susun `created_at DESC`; `finished` = `status = 'Finish'`; `averageScore` = purata `average_score` (bukan null) sesi Finish, dibundarkan, atau `null`; `latestAt` = `completed_at ?? created_at` terbaru antara sesi Finish; `total` = kiraan semua sesi pengguna.
- `learning`: kira `learning_progress.status` = `Completed` / `In Progress` / `Not Started`.

**`PATCH /api/admin/users/{user}/status`** — input `{ "status": "inactive" }`, validation `required|in:active,inactive`.
**`PATCH /api/admin/users/{user}/role`** — input `{ "role": "admin" }`, validation `required|in:user,admin`.
- Kedua-duanya: jika admin cuba ubah **dirinya sendiri** → 422 dengan `errors.user` = `"The change was not applied. Administrators cannot change their own role or status."`.
- Simpan, set `updated_at = now()`, output 200 = `$user->fresh()->toProfileArray()`.

## 6. Data yang modul lain guna

- **Prop Inertia `auth.user`** (dari `HandleInertiaRequests`, guna `User::toProfileArray()`): `user_id`, `full_name`, `email`, `status`, `role`, `created_at`, `updated_at`, `avatar_url`, `google_id`. `AuthContext` (`useAuth()` → `profile`, `user`) dibaca oleh `AppShell`, Dashboard, Mock Interview, Readiness, Progress, Resume, Learning. **Jangan tukar nama field ini** dan jangan ubah `toProfileArray()`.
- Selepas `updateProfile` berjaya, `ProfilePage` panggil `setProfile(updated)` — jadi API mesti pulangkan objek profil penuh (bentuk sama).
- `role === "admin"` digunakan untuk papar menu Admin; `status === "inactive"` membuatkan pengguna dilog keluar oleh `EnsureUserIsActive`.
- `authService.isTestAccountEmail` digunakan oleh Mock Interview (Izzat) — sudah dikekalkan, jangan ubah.
- `activity.recentSessions` menggunakan jenis `InterviewSessionSummary` (VIEW `interview_session_summaries`, milik modul Izzat) — baca sahaja.

## 7. Contoh corak untuk ditiru (modul Izzat yang sudah siap)

| Fail Izzat | Corak | Guna untuk |
|---|---|---|
| `app/Http/Controllers/Api/InterviewSessionController.php` | `index()` baca query (`limit`), `where('user_id', $request->user()->user_id)`, `orderByDesc`, `response()->json($rows)`; `store()` guna `$request->validate([...])`; route-model binding `InterviewSession $session` | `ProfileController` (guna `$request->user()`), `UserController@index/stats/show/activity` (query + json), `updateStatus/updateRole` (validate + save) |
| `app/Policies/InterviewSessionPolicy.php` | Peraturan akses dalam satu tempat (`view`, `update`), dipanggil dengan `$this->authorize('view', $session)` | Peraturan `guardSelf()` (admin tak boleh ubah diri sendiri). Anda boleh kekal dengan `guardSelf()` seperti dalam TODO; yang penting mesej ralat dan status 422 sama |
| `resources/js/modules/m3-mock-interview/services/interviewService.ts` | `api.get/post<T>(url, body)` dari `@/lib/api`, petakan hasil kepada jenis frontend | `profileService.ts`, `adminUserService.ts`, `authService.updatePassword` |

Forgot/reset password ialah kod standard Laravel Breeze — langkah tepat ada dalam TODO.

## 8. Cara uji

1. `composer run dev` (atau `php artisan serve` + `pnpm dev`) dan buka `http://localhost:8000`.
2. Log masuk dengan butang **test account** (Ali Test) di page login.
3. Buka **/profile**: nama dan emel dipaparkan. Tukar nama (cuba dengan ruang berganda) → simpan → nama di sidebar berubah. Muat semula page → nama kekal.
4. Di /profile, tukar kata laluan (min 8 aksara). Cuba 5 aksara → mesti keluar ralat "Password must be at least 8 characters.".
5. Log keluar. Buka **/forgot-password**, masukkan emel → keluar mesej "A reset link will be sent if the account exists.". Dengan `MAIL_MAILER=log`, buka `storage/logs/laravel.log` dan salin pautan `/reset-password/...`.
6. Buka pautan itu, tetapkan kata laluan baharu → dibawa ke /login dengan mesej "Your password has been reset.". Log masuk dengan kata laluan baharu. Cuba guna pautan sama sekali lagi → ralat token tidak sah.
7. Log masuk dengan **Admin Test**. Buka **/admin/users**: kad statistik ada nombor, senarai pengguna dipaparkan. Uji carian (nama/emel), penapis Role & Status, dan paging.
8. Klik seorang pengguna → **/admin/users/{id}**: profil + aktiviti (resume, temuduga, pembelajaran, sesi terkini).
9. Tukar status pengguna lain kepada inactive → badge berubah. Tukar semula ke active. Tukar role user ↔ admin.
10. Buka detail **akaun admin anda sendiri** dan cuba tukar role/status → mesti keluar mesej "The change was not applied. Administrators cannot change their own role or status.".
11. Log masuk sebagai Ali Test dan cuba buka /admin/users → mesti dihantar ke dashboard.

## 9. Siap bila

- ☐ Semua `TODO (Nada)` sudah dibuang dan diganti dengan kod sebenar (`grep -rn "TODO (Nada)" app resources` tiada hasil).
- ☐ `pnpm typecheck` lulus tanpa ralat.
- ☐ `php -l` lulus untuk setiap fail PHP yang diubah.
- ☐ Migrations `users` dan `password_reset_tokens` ada dan `php artisan migrate` berjaya pada database local kosong.
- ☐ Semua langkah dalam bahagian 8 berjaya.
- ☐ Tiada perubahan pada UI, routes, `types.ts`, nama fungsi atau login/register/logout.

## 10. 🤖 PROMPT untuk AI

Salin keseluruhan blok ini ke Claude/ChatGPT, kemudian tampal kandungan fail yang ia minta.

````text
Saya sedang membina semula sebahagian modul dalam aplikasi NextHire AI.
Stack: Laravel 12 + Inertia 2 + React 19 (TypeScript), PostgreSQL (Supabase), session-cookie auth, pnpm.

PERATURAN WAJIB:
- JANGAN ubah UI (pages/components), routes (routes/web.php, routes/auth.php), resources/js/lib/types.ts,
  nama fail, nama fungsi/method, parameter, jenis pulangan atau nama field JSON.
- JANGAN ubah login/register/logout/Google/test-account, model User, AuthContext, middleware.
- Hanya isi badan fungsi yang ada komen "// TODO (Nada): ...", ikut langkah dalam komen itu dengan tepat.
- Ikut corak fail contoh yang sudah siap: app/Http/Controllers/Api/InterviewSessionController.php
  ($request->validate, $request->user(), Eloquent query, response()->json), app/Policies/InterviewSessionPolicy.php,
  resources/js/modules/m3-mock-interview/services/interviewService.ts (api.get/put/patch dari "@/lib/api").
- Frontend: import { api, qs } from "@/lib/api". api.getOrNull pulangkan null bila 404. Ralat dilempar sebagai ApiError
  { message, status, errors }.

FAIL YANG PERLU DIISI:
1. app/Http/Controllers/Api/ProfileController.php: show, update, updatePassword
2. app/Http/Controllers/Auth/PasswordResetLinkController.php: store (create sudah siap)
3. app/Http/Controllers/Auth/NewPasswordController.php: store (create sudah siap)
4. app/Http/Controllers/Api/Admin/UserController.php: index, stats, show, activity, updateStatus, updateRole,
   + const RECENT_SESSIONS = 8, + private guardSelf()
5. resources/js/modules/m1-user-management/services/profileService.ts: getProfile, ensureProfile, updateProfile
6. resources/js/modules/m1-user-management/services/authService.ts: HANYA sendPasswordReset, updatePassword, resetPassword
7. resources/js/modules/admin/a1-user-management/services/adminUserService.ts: escapeSearch, listUsers, getUserStats,
   getUser, getUserActivity, setStatus, setRole
8. Migrations baharu dalam database/migrations untuk jadual users dan password_reset_tokens.

BENTUK PROFIL (User::toProfileArray(), jangan ubah):
{ user_id, full_name, email, status: "active"|"inactive", role: "user"|"admin", created_at (ISO), updated_at (ISO|null),
  avatar_url, google_id }

ENDPOINTS (semua API dalam middleware auth, active, verified; admin juga middleware admin → 403 "Administrators only."):
- GET  /api/profile → 200 profil pengguna log masuk.
- PUT  /api/profile  {full_name}: validate full_name required|string|min:1|max:120; nama = trim(preg_replace('/\s+/',' ',x));
       set updated_at=now(); save; → 200 $user->fresh()->toProfileArray(). Hanya full_name boleh diubah.
- PUT  /api/profile/password {password,password_confirmation}: validate ['required','confirmed',Rules\Password::min(8)];
       $request->user()->forceFill(['password'=>$data['password']])->save() (model cast 'hashed'); → 200 {"ok":true}.
- POST /forgot-password {email} (guest, Inertia form): validate required|email; Password::sendResetLink($request->only('email'));
       SENTIASA return back()->with('status', __('A reset link will be sent if the account exists.')).
- POST /reset-password {token,email,password,password_confirmation} (guest, Inertia form):
       validate token required, email required|email, password ['required','confirmed',Rules\Password::min(8)];
       $status = Password::reset($request->only('email','password','password_confirmation','token'), function ($user) use ($request) {
           $user->forceFill(['password'=>Hash::make($request->password),'remember_token'=>Str::random(60)])->save();
           event(new PasswordReset($user)); });
       if ($status == Password::PasswordReset) return to_route('login')->with('status', __($status));
       else throw ValidationException::withMessages(['email' => [__($status)]]).
- GET  /api/admin/users?search&role&status&page&pageSize:
       page=max(1,(int)page default 1); pageSize=min(100,max(1,(int)pageSize default 20)); search=trim;
       if search: $like='%'.addcslashes($search,'%_\\').'%'; where(full_name ilike $like OR email ilike $like);
       role filter only if in ['user','admin'] (strict); status filter only if in ['active','inactive'];
       total=(clone $query)->count(); rows=orderByDesc('created_at')->forPage(page,pageSize)->get()->map(toProfileArray);
       → 200 {"rows":[...],"total":n,"page":p,"pageSize":s}
- GET  /api/admin/users/stats → 200 {"total","active","inactive","admins","newThisWeek"} (newThisWeek: created_at >= now()->subDays(7)).
- GET  /api/admin/users/{user} (UUID route-model binding) → 200 profil; 404 jika tiada.
- GET  /api/admin/users/{user}/activity → 200
       { resumes:{count, latestScore:int|null, latestAt:ISO|null},
         interviews:{total, finished, averageScore:int|null, latestAt:ISO|null},
         learning:{completed, inProgress, notStarted},
         recentSessions: InterviewSessionSummary[] (maks 8) }
       resumes: Resume::where(user_id)->count(); latest = orderByDesc('analyzed_at')->first(['overall_score','analyzed_at']);
         latestScore=(int)round(overall_score); latestAt=optional(analyzed_at)->toISOString().
       interviews: $sessions = InterviewSessionSummary::where(user_id)->orderByDesc('created_at')->limit(500)->get();
         finished = status 'Finish'; averageScore = round(avg of non-null average_score of finished) or null;
         latestAt = max(completed_at ?? created_at) of finished, ISO; total = InterviewSessionSummary::where(user_id)->count().
       learning: LearningProgress::where(user_id)->pluck('status') counted for 'Completed','In Progress','Not Started'.
       recentSessions = $sessions->take(8)->values().
- PATCH /api/admin/users/{user}/status {status}: validate required|in:active,inactive; guardSelf; save + updated_at=now();
       → 200 $user->fresh()->toProfileArray().
- PATCH /api/admin/users/{user}/role {role}: validate required|in:user,admin; guardSelf; save + updated_at=now(); → 200 profil.
- guardSelf: if ($request->user()->user_id === $user->user_id) throw ValidationException::withMessages(
       ['user' => 'The change was not applied. Administrators cannot change their own role or status.']) → 422.

FRONTEND:
- profileService.getProfile → api.get<UserProfile>("/api/profile"); ensureProfile → sama; updateProfile(_id, update) → api.put<UserProfile>("/api/profile", update).
- authService.sendPasswordReset(email) → await post("/forgot-password", { email })  (post() ialah helper Inertia dalam fail itu).
- authService.updatePassword(password) → api.put("/api/profile/password", { password, password_confirmation: password })
    .catch(error => { const first = error.errors ? Object.values(error.errors)[0]?.[0] : undefined; throw new Error(friendlyAuthError(first ?? error.message)) }).
- authService.resetPassword(token,email,password) → await post("/reset-password", { token, email, password, password_confirmation: password }).
- adminUserService.escapeSearch(raw) → raw.replace(/\s+/g, " ").trim().
- listUsers({search="",role="all",status="all",page=1,pageSize=20}) → api.get<ListUsersResult>(`/api/admin/users${qs({ search: escapeSearch(search), role: role==="all"?"":role, status: status==="all"?"":status, page, pageSize })}`).
- getUserStats → api.get<UserStats>("/api/admin/users/stats"); getUser(id) → api.getOrNull<UserProfile>(`/api/admin/users/${id}`);
  getUserActivity(id) → api.get<UserActivity>(`/api/admin/users/${id}/activity`);
  setStatus(id,status) → api.patch<UserProfile>(`/api/admin/users/${id}/status`, { status });
  setRole(id,role) → api.patch<UserProfile>(`/api/admin/users/${id}/role`, { role }).

JADUAL (PostgreSQL, tulis migration yang sama tepat):
users: user_id uuid PK default gen_random_uuid(); full_name text NOT NULL default ''; email text NOT NULL UNIQUE (users_email_key);
  role text NOT NULL default 'user' CHECK (role IN ('user','admin')) (users_role_check);
  status text NOT NULL default 'active' CHECK (status IN ('active','inactive')) (users_status_check);
  created_at timestamptz NOT NULL default now(); updated_at timestamptz NULL; password text NULL; remember_token varchar(100) NULL;
  email_verified_at timestamptz NULL; google_id text NULL (UNIQUE INDEX users_google_id_key ON users(google_id) WHERE google_id IS NOT NULL);
  avatar_url text NULL.
password_reset_tokens: email text PK; token text NOT NULL; created_at timestamptz NULL.

Selepas siap: pnpm typecheck mesti lulus, php -l lulus, tiada lagi "TODO (Nada)".
Mula dengan bertanya kandungan fail yang anda perlukan, kemudian beri kod lengkap setiap fail.
````
