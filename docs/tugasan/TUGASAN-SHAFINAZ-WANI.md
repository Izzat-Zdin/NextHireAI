# Tugasan Shafinaz & Wani: M5 Learning Recommendation

Baca [PANDUAN-TIM.md](PANDUAN-TIM.md) dahulu (setup, cara kerja, cara commit).

## 1. Modul & owner

| Bahagian | Apa | Owner |
|---|---|---|
| **M5 Learning Recommendation** (sisi pengguna) | Page `/learning` dan `/learning/{id}`: senarai resource, "Save to plan", Start, ubah %, Complete, Remove | Shafinaz & Wani |

**A2 Admin Learning Resources** (page `/admin/resources`) ialah tugasan **Wani seorang**: lihat [TUGASAN-WANI.md](TUGASAN-WANI.md). Wani juga yang membina jadual `learning_resources` dan model `LearningResource.php`, kerana A2 menguruskan katalog itu.

**Bergantung pada Wani:** jadual `learning_progress` ada foreign key ke `learning_resources`, jadi migration Wani mesti siap dahulu. `LearningController::resources()` (senarai katalog, dalam fail anda) juga dipakai oleh page admin Wani, jadi siapkan ia **paling awal**.

## 2. Fail yang sudah siap (jangan ubah)

- Semua UI: `resources/js/modules/learning-recommendation/pages/*`, `components/*`, `resourceMeta.ts`
- `resources/js/modules/learning-recommendation/hooks/useLearningProgress.ts` (UI state + optimistic update; ia hanya memanggil `learningService` dan `progressPatches`, jadi akan berfungsi sendiri bila service anda siap)
- `resources/js/lib/*` — terutamanya `lib/insights.ts` (`fetchResources`, `fetchLearningProgress`, `rankResources`) dan `lib/types.ts` (`LearningResource`, `LearningProgressRow`, `ResourceType`, `LearningStatus`)
- `routes/web.php` (semua route sudah ada)
- `app/Models/LearningResource.php` dan migration `learning_resources` — dibina oleh Wani (A2)
- `app/Models/User.php` (relation `learningProgress()`), `app/Http/Controllers/Api/Admin/UserController.php` (guna `LearningProgress`)

## 3. Fail yang perlu diisi

Cari `TODO (Shafinaz & Wani)` dalam setiap fail.

**`app/Http/Controllers/Api/LearningController.php`**
- [ ] `resources()` — semua `learning_resources`, susun `title` A–Z, pulangkan array JSON.
- [ ] `resource($resource)` — pulangkan satu resource (404 automatik jika tiada).
- [ ] `progress($request)` — semua baris `learning_progress` milik pengguna log masuk.
- [ ] `upsertProgress($request, $resource)` — validate, `updateOrCreate` pada (user_id, resource_id), pulangkan baris terkini.
- [ ] `removeProgress($request, $resource)` — padam baris milik pengguna untuk resource itu, 204.

**`app/Models/LearningProgress.php`**
- [ ] `$guarded = []` (atau `$fillable`), cast `progress_percent` → integer, `completed_at` → datetime.

**`resources/js/modules/learning-recommendation/services/learningService.ts`**
- [ ] helper `now()`, `clampPercent()`, dan fungsi dalaman `upsertProgress()` (PUT).
- [ ] `progressPatches.save / start / complete / percent` — peraturan status/peratus (lihat bahagian 5).
- [ ] `saveToPlan`, `startResource`, `completeResource`, `updateProgress` — panggil `upsertProgress` dengan patch yang betul.
- [ ] `removeFromPlan` — DELETE.
- [ ] `fetchResource` — semak UUID, kemudian `api.getOrNull`.

**`database/migrations/`** (folder baru)
- [ ] Migration `learning_progress` (lihat bahagian 4). Jalankan selepas migration `learning_resources` Wani.

## 4. Database

Database Supabase yang dikongsi **sudah ada** jadual ini. Jangan padam/cipta semula jadual di sana. Tetapi anda **mesti tulis migration Laravel** dalam `database/migrations/` yang mencipta semula `learning_progress` **tepat sama**, supaya database tempatan yang kosong (`php artisan migrate`) boleh berfungsi. Jadual `learning_resources` (dibina Wani) adalah seperti dalam [TUGASAN-WANI.md](TUGASAN-WANI.md).

### `learning_progress`

| Kolum | Jenis | Null | Default | Kunci / constraint |
|---|---|---|---|---|
| `progress_id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| `user_id` | uuid | NO | — | FOREIGN KEY → `users(user_id)` ON DELETE CASCADE |
| `resource_id` | uuid | NO | — | FOREIGN KEY → `learning_resources(resource_id)` ON DELETE CASCADE |
| `status` | text | NO | `'Not Started'` | CHECK `status IN ('Not Started','In Progress','Completed')` |
| `progress_percent` | integer | NO | `0` | CHECK `progress_percent >= 0 AND progress_percent <= 100` |
| `completed_at` | timestamptz | YES | — | |

- UNIQUE `(user_id, resource_id)` (nama: `learning_progress_user_id_resource_id_key`) — inilah kunci untuk upsert.
- INDEX `idx_learning_progress_user` pada `(user_id)`.
- Tiada `created_at` / `updated_at` (model guna `$timestamps = false`).

**Tip migration:** Laravel tiada CHECK terbina, jadi guna `DB::statement(...)`, contoh:

```php
DB::statement("ALTER TABLE learning_progress ADD CONSTRAINT learning_progress_status_check CHECK (status = ANY (ARRAY['Not Started','In Progress','Completed']))");
```

`$table->uuid('progress_id')->primary()->default(DB::raw('gen_random_uuid()'))`, `$table->timestampTz('completed_at')->nullable()`. Jadual `users` dan `learning_resources` mesti wujud dahulu.

## 5. API

Semua endpoint di bawah dalam kumpulan `auth` (`routes/web.php`, prefix `/api`). Pengguna mesti log masuk (session). Ralat validation → **422** `{ "message": "...", "errors": { "field": ["..."] } }` (automatik Laravel).

### M5 (semua pengguna log masuk)

**`GET /api/learning/resources`** → `LearningController@resources`
- Input: tiada. Output 200, susun ikut `title` A–Z:
```json
[
  { "resource_id": "6f1c…-uuid", "title": "SQL for Data Analysis", "resource_type": "Course",
    "skill_name": "SQL", "resource_url": "https://example.com/sql", "skill_tags": ["sql", "data-analysis"] }
]
```

**`GET /api/learning/resources/{resource}`** → `LearningController@resource`
- `{resource}` = `resource_id` (uuid, route model binding). Output 200: satu objek seperti di atas. Tiada → **404**.

**`GET /api/learning/progress`** → `LearningController@progress`
- Hanya baris `user_id` = pengguna semasa. Output 200:
```json
[
  { "progress_id": "a2b…-uuid", "user_id": "u1…-uuid", "resource_id": "6f1c…-uuid",
    "status": "In Progress", "progress_percent": 40, "completed_at": null }
]
```

**`PUT /api/learning/resources/{resource}/progress`** → `LearningController@upsertProgress`
- Validation:
  - `status`: required, `in:Not Started,In Progress,Completed`
  - `progress_percent`: required, integer, min 0, max 100
  - `completed_at`: nullable, date
- Logic: `LearningProgress::updateOrCreate(['user_id' => user, 'resource_id' => resource], ['status', 'progress_percent', 'completed_at' ?? null])`. Server simpan apa yang dihantar (peraturan dibuat di frontend oleh `progressPatches`).
- Output **200**: baris terkini (`$row->fresh()`), contoh `{ "progress_id": "…", "user_id": "…", "resource_id": "…", "status": "Completed", "progress_percent": 100, "completed_at": "2026-11-13T08:30:00.000000Z" }`. Resource tiada → 404. Input salah → 422.

**`DELETE /api/learning/resources/{resource}/progress`** → `LearningController@removeProgress`
- Padam baris (user semasa + resource ini). Output **204** (tiada body).

**Peraturan `progressPatches` (frontend, `learningService.ts`)** — patch yang dihantar ke PUT:

| Fungsi | Patch |
|---|---|
| `save()` | `{ status: "Not Started", progress_percent: 0, completed_at: null }` |
| `start(current)` | `{ status: "In Progress", progress_percent: (current && current.status !== "Completed") ? current.progress_percent : 0, completed_at: null }` |
| `complete()` | `{ status: "Completed", progress_percent: 100, completed_at: new Date().toISOString() }` |
| `percent(value, current)` | `p = clamp(round(value), 0..100)` (bukan nombor → 0); `p >= 100` → `complete()`; `p === 0` dan (tiada current atau current.status "Not Started") → `save()`; selain itu `{ status: "In Progress", progress_percent: p, completed_at: null }` |

`saveToPlan` = upsert `save()`, `startResource` = upsert `start(current)`, `completeResource` = upsert `complete()`, `updateProgress` = upsert `percent(percent, current)`. `fetchResource(id)`: jika `id` bukan UUID → `null` tanpa panggil API, jika tidak `api.getOrNull(...)` (404 → `null`).

## 6. Data yang modul lain guna (PENTING)

Modul Izzat membaca data anda melalui `resources/js/lib/insights.ts`:
- `fetchResources()` → `GET /api/learning/resources`
- `fetchLearningProgress()` → `GET /api/learning/progress`

Selagi endpoint itu belum siap, Dashboard, Readiness, Progress dan Profile akan nampak kosong. **Jangan tukar nama atau jenis medan berikut:**

| Medan | Jenis | Dipakai oleh |
|---|---|---|
| `resource.resource_id` | string (uuid) | `insights.ts` `rankResources` (padan dengan progress), `DashboardPage.tsx` (peta tajuk, link `/learning/{id}`), `progressInsights.ts` |
| `resource.title` | string | `DashboardPage.tsx` (top pick, aktiviti), `progressInsights.ts` (langkah seterusnya, aktiviti) |
| `resource.resource_type` | `ResourceType` | `DashboardPage.tsx` (`typeLabel(...)`) |
| `resource.skill_name` | string | `insights.ts` (ayat sebab), `DashboardPage.tsx` |
| `resource.skill_tags` | **string[]** (mesti array, bukan string `{a,b}`) | `insights.ts` `rankResources` (`resource.skill_tags.filter/some`) — jika bukan array, Dashboard & Progress akan crash |
| `progress.resource_id` | string | `insights.ts`, `DashboardPage.tsx`, `progressInsights.ts` |
| `progress.status` | `"Not Started" \| "In Progress" \| "Completed"` (ejaan tepat) | `DashboardPage.tsx`, `interview-readiness/services/assessmentEngine.ts`, `ReadinessPage.tsx`, `recommendation-tracking/pages/ProgressPage.tsx`, `progressInsights.ts`, `user-management/pages/ProfilePage.tsx`, `insights.ts` |
| `progress.completed_at` | ISO string atau `null` | `DashboardPage.tsx` (aktiviti terkini), `progressInsights.ts` (penapis tempoh + aktiviti) |
| `progress.progress_percent` | integer 0–100 | page M5 anda sendiri (`ProgressSlider`, `ResourceCard`) |

Di backend: `Admin\UserController::activity` guna `LearningProgress::where('user_id', …)->pluck('status')` dan `User::learningProgress()` guna model `LearningProgress` — jangan tukar nama kelas, `$table` atau `$primaryKey`.

## 7. Contoh corak untuk ditiru

| Corak dalam fail Izzat | Guna untuk fail anda |
|---|---|
| `InterviewSessionController::index` — query `where('user_id', $request->user()->user_id)` + `response()->json($rows)` | `LearningController::progress` (hanya data milik sendiri) dan `resources` |
| `InterviewSessionController::store` — `$request->validate([... 'in:HR,Tech,Behaviour' ...])` lalu `Model::create(...)` | `upsertProgress` (validate + `updateOrCreate`) |
| `InterviewSessionController::destroy` — padam dan pulangkan 204 | `removeProgress` |
| `InterviewSessionPolicy` — semak `$session->user_id === $user->user_id` | M5 tidak perlu Policy kerana setiap query sudah ditapis dengan `user_id` pengguna semasa. |
| `interviewService.ts` — `api.post/put/delete` dengan URL `/api/...` dan jenis dari `@/lib/types` | `learningService.ts` |

## 8. Cara uji

**M5 (pengguna):**
1. `php artisan serve` + `pnpm dev`, buka http://localhost:8000, tekan "Test user".
2. Buka `/learning` — senarai resource muncul (tersusun A–Z), ada cadangan berdasarkan skill gap.
3. Tekan ikon simpan / "Save to plan" pada satu resource → badge "Saved", mesej berjaya.
4. Tekan Start → "In progress". Gerakkan slider ke 40% → simpan. Refresh page → masih 40%.
5. Gerakkan ke 100% (atau tekan Complete) → "Completed". Buka Dashboard → aktiviti "Learning completed" muncul.
6. Tekan Start semula pada resource yang Completed → kembali 0%, "In progress".
7. Tekan Remove → resource keluar dari plan. Refresh → masih tiada.
8. Buka `/learning/{resource_id}` (klik satu kad) → page detail muncul. Cuba `/learning/abc` → "Resource not found".
9. Semak Network tab: PUT pulangkan 200 dengan baris, DELETE pulangkan 204.

## 9. Siap bila

- [ ] Semua `TODO (Shafinaz & Wani)` sudah diganti dengan kod sebenar (cari dalam projek: tiada lagi).
- [ ] Migration `learning_progress` jalan pada database kosong (selepas migration Wani) dan sama dengan jadual di bahagian 4.
- [ ] `/learning`: simpan, start, ubah %, complete, remove semua berfungsi dan kekal selepas refresh.
- [ ] Dashboard, Readiness dan Progress (modul Izzat) memaparkan data learning semula.
- [ ] `php -l` tiada ralat, `pnpm typecheck` lulus.
- [ ] Tiada perubahan pada UI, route, `lib/*` atau `types.ts`.
- [ ] Commit + push ke branch anda.

## 10. 🤖 PROMPT untuk AI

Salin keseluruhan blok ini ke Claude / ChatGPT, kemudian lampirkan fail yang berkaitan (fail TODO anda + 3 fail contoh Izzat).

````text
Saya sedang membina semula Module 5 Learning Recommendation dalam app Laravel 12 + Inertia 2 + React 19 (TypeScript), PostgreSQL (Supabase), auth guna session Laravel. Nama app: NextHire AI.

PERATURAN WAJIB:
- JANGAN ubah UI, page/component, routes/web.php, resources/js/lib/* (termasuk types.ts dan insights.ts), nama fail, nama fungsi/method, parameter, return type, atau jenis TypeScript.
- Hanya isi bahagian bertanda "TODO (Shafinaz & Wani)" dalam fail yang saya beri.
- Ikut corak fail contoh: app/Http/Controllers/Api/InterviewSessionController.php (validate, query where user_id, response()->json), app/Policies/InterviewSessionPolicy.php, resources/js/modules/mock-interview/services/interviewService.ts (api.get/post/put/delete/getOrNull dari "@/lib/api").
- Model guna HasUuids, $timestamps = false, $keyType = 'string', $incrementing = false (sudah ada, kekalkan).

FAIL UNTUK DIISI:
1. app/Http/Controllers/Api/LearningController.php
2. app/Models/LearningProgress.php
3. resources/js/modules/learning-recommendation/services/learningService.ts
4. database/migrations/*_create_learning_progress_table.php (baru)
(Model LearningResource dan jadual learning_resources dibina oleh rakan lain; anggap ia sudah wujud dengan kolum resource_id, title, resource_type, resource_url, skill_tags text[], skill_name.)

DATABASE (cipta semula TEPAT dalam migration; guna DB::statement untuk CHECK):
learning_progress:
  progress_id uuid PK NOT NULL DEFAULT gen_random_uuid()
  user_id uuid NOT NULL FK -> users(user_id) ON DELETE CASCADE
  resource_id uuid NOT NULL FK -> learning_resources(resource_id) ON DELETE CASCADE
  status text NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started','In Progress','Completed'))
  progress_percent integer NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100)
  completed_at timestamptz NULL
  UNIQUE (user_id, resource_id)  -- nama: learning_progress_user_id_resource_id_key
  INDEX idx_learning_progress_user (user_id)
Tiada created_at/updated_at. Jadual users sudah wujud.

MODEL:
- LearningProgress: table learning_progress, PK progress_id, protected $guarded = []; casts: progress_percent => 'integer', completed_at => 'datetime'.

API (dalam middleware auth, prefix /api; sudah didaftar dalam routes/web.php):
M5 LearningController:
- resources(): GET /api/learning/resources -> LearningResource::orderBy('title')->get(), 200, array of {resource_id, title, resource_type, skill_name, resource_url, skill_tags: string[]}.
- resource(LearningResource $resource): GET /api/learning/resources/{resource} -> 200 objek resource (404 automatik melalui route model binding).
- progress(Request): GET /api/learning/progress -> LearningProgress::where('user_id', $request->user()->user_id)->get(), 200, array of {progress_id, user_id, resource_id, status, progress_percent, completed_at}.
- upsertProgress(Request, LearningResource $resource): PUT /api/learning/resources/{resource}/progress
    validate: status required in:Not Started,In Progress,Completed; progress_percent required integer min:0 max:100; completed_at nullable date
    LearningProgress::updateOrCreate(['user_id' => user_id, 'resource_id' => $resource->resource_id], ['status' => ..., 'progress_percent' => ..., 'completed_at' => $data['completed_at'] ?? null])
    return response()->json($row->fresh()) (200). Server tidak ubah nilai; peraturan dibuat di frontend.
- removeProgress(Request, LearningResource $resource): DELETE same path -> padam where user_id = user semasa AND resource_id = resource; return response()->json(null, 204).

FRONTEND learningService.ts (kekalkan semua export dan jenis: ProgressPatch, progressPatches, saveToPlan, startResource, completeResource, updateProgress, removeFromPlan, fetchResource, learningService):
- import { api } from "@/lib/api"
- const now = () => new Date().toISOString()
- const clampPercent = (v: number) => Math.max(0, Math.min(100, Math.round(Number.isFinite(v) ? v : 0)))
- progressPatches.save() -> { status: "Not Started", progress_percent: 0, completed_at: null }
- progressPatches.start(current?) -> keep = current && current.status !== "Completed" ? current.progress_percent : 0; { status: "In Progress", progress_percent: keep, completed_at: null }
- progressPatches.complete() -> { status: "Completed", progress_percent: 100, completed_at: now() }
- progressPatches.percent(value, current?) -> p = clampPercent(value); p >= 100 -> complete(); p === 0 && (!current || current.status === "Not Started") -> save(); else { status: "In Progress", progress_percent: p, completed_at: null }
- function upsertProgress(resourceId, patch) (tidak export) -> api.put<LearningProgressRow>(`/api/learning/resources/${resourceId}/progress`, patch)
- saveToPlan(id) = upsertProgress(id, save()); startResource(id, current) = upsertProgress(id, start(current)); completeResource(id) = upsertProgress(id, complete()); updateProgress(id, percent, current) = upsertProgress(id, percent(percent, current))
- removeFromPlan(id): await api.delete(`/api/learning/resources/${id}/progress`)
- fetchResource(id): jika id tidak padan /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i return null; else return api.getOrNull<LearningResource>(`/api/learning/resources/${id}`)

MODUL LAIN BERGANTUNG PADA DATA INI (jangan tukar nama/jenis): resource_id, title, resource_type, skill_name, skill_tags (MESTI array string), progress.resource_id, progress.status (ejaan tepat), progress.completed_at (ISO string/null), progress.progress_percent (integer).

Beri kod penuh untuk setiap fail, kemudian terangkan ringkas setiap bahagian supaya saya faham untuk pembentangan.
````
