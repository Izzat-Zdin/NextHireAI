# Tugasan Wani: A2 Admin Learning Resources

Baca [PANDUAN-TIM.md](PANDUAN-TIM.md) dahulu (setup, cara kerja, cara commit).

## 1. Modul & owner

| Bahagian | Apa | Owner |
|---|---|---|
| **A2 Admin Learning Resources** (sisi admin) | Page `/admin/resources`: senarai, tambah, edit, padam resource pembelajaran | Wani |

Wani juga membina **jadual `learning_resources`** (migration) dan **model `LearningResource.php`**, kerana A2 menguruskan katalog itu. Module 5 (Shafinaz & Wani, [TUGASAN-SHAFINAZ-WANI.md](TUGASAN-SHAFINAZ-WANI.md)) bergantung padanya, jadi **siapkan migration dan model ini dahulu**.

Senarai resource dalam page admin datang dari `GET /api/learning/resources` (`LearningController::resources()`, sebahagian M5). Kalau M5 belum siap, senarai admin akan kosong, tetapi tambah/edit/padam anda masih boleh diuji melalui Network tab.

## 2. Fail yang sudah siap (jangan ubah)

- `resources/js/modules/admin/learning-resources/pages/AdminResourcesPage.tsx`, `components/ResourceForm.tsx`
- `resources/js/lib/*` — terutamanya `lib/types.ts` (`LearningResource`, `ResourceType`)
- `routes/web.php` (semua route sudah ada)
- `app/Http/Middleware/EnsureUserIsAdmin.php` (middleware `admin`), `app/Casts/PgTextArray.php`

## 3. Fail yang perlu diisi

Cari `TODO (Wani)` dalam setiap fail.

**`app/Http/Controllers/Api/Admin/ResourceController.php`**
- [ ] `store($request)` — validate (required), create, 201.
- [ ] `update($request, $resource)` — validate (sometimes), fill + save, 200.
- [ ] `destroy($resource)` — delete, 204.
- [ ] (cadangan) `private const TYPES` + `private function validated(Request $request, bool $creating): array`.

**`app/Models/LearningResource.php`**
- [ ] `$guarded = []` (atau `$fillable`), cast `skill_tags` → `PgTextArray`, relation `progress()` (HasMany).

**`resources/js/modules/admin/learning-resources/services/adminResourceService.ts`**
- [ ] `listAllResources` — GET `/api/learning/resources`.
- [ ] `createResource` — POST. `updateResource` — PUT. `deleteResource` — DELETE.

**`database/migrations/`** (folder baru)
- [ ] Migration `learning_resources` (lihat bahagian 4). Boleh tambah seeder kecil (beberapa resource) untuk ujian tempatan.

## 4. Database

Database Supabase yang dikongsi **sudah ada** jadual ini (dan sudah ada **22 baris resource**: Article 4, Cert 3, Course 7, Practice 5, Project 1, Tutorial 2). Jangan padam/cipta semula jadual di sana. Tetapi anda **mesti tulis migration Laravel** dalam `database/migrations/` yang mencipta semula jadual ini **tepat sama**, supaya database tempatan yang kosong (`php artisan migrate`) boleh berfungsi.

### `learning_resources`

| Kolum | Jenis | Null | Default | Kunci / constraint |
|---|---|---|---|---|
| `resource_id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| `title` | text | NO | — | |
| `resource_type` | text | NO | — | CHECK `resource_type IN ('Course','Tutorial','Project','Cert','Article','Video','Practice')` |
| `resource_url` | text | YES | — | |
| `skill_tags` | text[] | NO | `'{}'::text[]` | |
| `skill_name` | text | NO | `''` | |

- Tiada `created_at` / `updated_at` (model guna `$timestamps = false`).
- Jadual `learning_progress` (M5) ada foreign key ke `resource_id` dengan ON DELETE CASCADE, jadi padam resource juga memadam progress pengguna untuk resource itu.

**Tip migration:** Laravel tiada jenis `text[]` dan CHECK terbina, jadi guna `DB::statement(...)` untuk bahagian itu, contoh:

```php
DB::statement("ALTER TABLE learning_resources ADD COLUMN skill_tags text[] NOT NULL DEFAULT '{}'::text[]");
DB::statement("ALTER TABLE learning_resources ADD CONSTRAINT learning_resources_resource_type_check CHECK (resource_type = ANY (ARRAY['Course','Tutorial','Project','Cert','Article','Video','Practice']))");
```

`$table->uuid('resource_id')->primary()->default(DB::raw('gen_random_uuid()'))`, `$table->text('title')`, `$table->text('resource_url')->nullable()`.

## 5. API

Semua endpoint dalam kumpulan `auth` (`routes/web.php`, prefix `/api`). Ralat validation → **422** `{ "message": "...", "errors": { "field": ["..."] } }` (automatik Laravel).

### A2 (admin sahaja — middleware `admin`, bukan admin → **403** `{ "message": "Administrators only." }`)

Senarai untuk page admin guna `GET /api/learning/resources` di atas.

**`POST /api/admin/resources`** → `Admin\ResourceController@store`
- Validation:
  - `title`: required, string, max 200
  - `resource_type`: required, `in:Course,Tutorial,Project,Cert,Article,Video,Practice`
  - `skill_name`: required, string, max 120
  - `resource_url`: nullable, url, max 2000
  - `skill_tags`: sometimes, array; `skill_tags.*`: string, max 60
- Contoh body: `{ "title": "React Basics", "resource_type": "Tutorial", "skill_name": "React", "resource_url": "https://react.dev/learn", "skill_tags": ["react", "javascript"] }`
- Output **201**: baris baru (`$row->fresh()`, termasuk `resource_id`).

**`PUT /api/admin/resources/{resource}`** → `Admin\ResourceController@update`
- Validation sama, tetapi `title`, `resource_type`, `skill_name` jadi `sometimes` (boleh hantar separa).
- `$resource->fill($data)->save()`. Output **200**: baris terkini. Tiada → 404.

**`DELETE /api/admin/resources/{resource}`** → `Admin\ResourceController@destroy`
- `$resource->delete()`. Baris `learning_progress` berkaitan terpadam sendiri (ON DELETE CASCADE). Output **204**.

## 6. Data yang modul lain guna (PENTING)

Resource yang admin tambah dibaca oleh Module 5 dan modul Izzat (Dashboard, Readiness, Progress) melalui `lib/insights.ts`. **Jangan tukar nama atau jenis medan berikut:**

| Medan | Jenis | Dipakai oleh |
|---|---|---|
| `resource.resource_id` | string (uuid) | `insights.ts` `rankResources` (padan dengan progress), `DashboardPage.tsx` (peta tajuk, link `/learning/{id}`), `progressInsights.ts` |
| `resource.title` | string | `DashboardPage.tsx` (top pick, aktiviti), `progressInsights.ts` (langkah seterusnya, aktiviti) |
| `resource.resource_type` | `ResourceType` | `DashboardPage.tsx` (`typeLabel(...)`) |
| `resource.skill_name` | string | `insights.ts` (ayat sebab), `DashboardPage.tsx` |
| `resource.skill_tags` | **string[]** (mesti array, bukan string `{a,b}`) | `insights.ts` `rankResources` (`resource.skill_tags.filter/some`) — jika bukan array, Dashboard & Progress akan crash |

## 7. Contoh corak untuk ditiru

| Corak dalam fail Izzat | Guna untuk fail anda |
|---|---|
| `InterviewSessionController::store` — `$request->validate([... 'in:HR,Tech,Behaviour' ...])` lalu `Model::create(...)` | `Admin\ResourceController::store` |
| `InterviewSessionController::destroy` — padam dan pulangkan 204 | `Admin\ResourceController::destroy` |
| `InterviewSessionPolicy` | Tidak perlu Policy: A2 dijaga oleh middleware `admin`. (Jika mahu, boleh tulis `LearningResourcePolicy` dengan `$user->isAdmin()`.) |
| `interviewService.ts` — `api.post/put/delete` dengan URL `/api/...` dan jenis dari `@/lib/types` | `adminResourceService.ts` |

## 8. Cara uji

1. Log masuk sebagai admin, buka `/admin/resources`.
2. Tambah resource baru (isi title, type, skill, URL, tags) → muncul dalam senarai, status 201.
3. Cuba simpan tanpa title atau dengan URL salah → mesej ralat 422 pada borang.
4. Edit resource → perubahan kekal selepas refresh.
5. Padam resource → hilang dari senarai (dan dari `/learning`).
6. Log masuk sebagai test user dan cuba `POST /api/admin/resources` → 403.

## 9. Siap bila

- [ ] Semua `TODO (Wani)` sudah diganti dengan kod sebenar (cari dalam projek: tiada lagi).
- [ ] Migration `learning_resources` jalan pada database kosong (`php artisan migrate:fresh`) dan sama dengan jadual di bahagian 4.
- [ ] `/admin/resources`: tambah, edit, padam berfungsi; bukan admin dapat 403.
- [ ] `php -l` tiada ralat, `pnpm typecheck` lulus.
- [ ] Tiada perubahan pada UI, route, `lib/*` atau `types.ts`.
- [ ] Commit + push ke branch anda.

## 10. 🤖 PROMPT untuk AI

Salin keseluruhan blok ini ke Claude / ChatGPT, kemudian lampirkan fail yang berkaitan (fail TODO anda + 3 fail contoh Izzat).

````text
Saya sedang membina semula modul Admin Learning Resources dalam app Laravel 12 + Inertia 2 + React 19 (TypeScript), PostgreSQL (Supabase), auth guna session Laravel. Nama app: NextHire AI.

PERATURAN WAJIB:
- JANGAN ubah UI, page/component, routes/web.php, resources/js/lib/* (termasuk types.ts dan insights.ts), nama fail, nama fungsi/method, parameter, return type, atau jenis TypeScript.
- Hanya isi bahagian bertanda "TODO (Wani)" dalam fail yang saya beri.
- Ikut corak fail contoh: app/Http/Controllers/Api/InterviewSessionController.php (validate, query where user_id, response()->json), app/Policies/InterviewSessionPolicy.php, resources/js/modules/mock-interview/services/interviewService.ts (api.get/post/put/delete/getOrNull dari "@/lib/api").
- Model guna HasUuids, $timestamps = false, $keyType = 'string', $incrementing = false (sudah ada, kekalkan).

FAIL UNTUK DIISI:
1. app/Http/Controllers/Api/Admin/ResourceController.php
2. app/Models/LearningResource.php
3. resources/js/modules/admin/learning-resources/services/adminResourceService.ts
4. database/migrations/*_create_learning_resources_table.php (baru)

DATABASE (cipta semula TEPAT dalam migration; guna DB::statement untuk text[] dan CHECK):
learning_resources:
  resource_id uuid PK NOT NULL DEFAULT gen_random_uuid()
  title text NOT NULL
  resource_type text NOT NULL CHECK (resource_type IN ('Course','Tutorial','Project','Cert','Article','Video','Practice'))  -- nama: learning_resources_resource_type_check
  resource_url text NULL
  skill_tags text[] NOT NULL DEFAULT '{}'::text[]
  skill_name text NOT NULL DEFAULT ''
Tiada created_at/updated_at.

MODEL:
- LearningResource: table learning_resources, PK resource_id, protected $guarded = []; casts: skill_tags => App\Casts\PgTextArray::class (sudah wujud; tukar text[] Postgres <-> array PHP); relation progress(): hasMany(LearningProgress::class, 'resource_id', 'resource_id').

API (middleware auth + admin, prefix /api; sudah didaftar dalam routes/web.php):
- private const TYPES = 'Course,Tutorial,Project,Cert,Article,Video,Practice';
- private function validated(Request $request, bool $creating): array — $req = $creating ? 'required' : 'sometimes';
    title [$req,'string','max:200'], resource_type [$req,'in:'.TYPES], skill_name [$req,'string','max:120'],
    resource_url ['nullable','url','max:2000'], skill_tags ['sometimes','array'], skill_tags.* ['string','max:60']
- store(Request): POST /api/admin/resources -> create(validated(creating:true)) -> response()->json($row->fresh(), 201)
- update(Request, LearningResource $resource): PUT /api/admin/resources/{resource} -> fill(validated(creating:false))->save() -> response()->json($resource->fresh()) 200
- destroy(LearningResource $resource): DELETE /api/admin/resources/{resource} -> delete() -> response()->json(null, 204)
Senarai untuk page admin guna GET /api/learning/resources (LearningController::resources, dibina rakan lain).

FRONTEND adminResourceService.ts (kekalkan ResourceInput, listAllResources, createResource, updateResource, deleteResource, adminResourceService):
- listAllResources() -> api.get<LearningResource[]>("/api/learning/resources")
- createResource(input) -> api.post<LearningResource>("/api/admin/resources", input)
- updateResource(resourceId, input) -> api.put<LearningResource>(`/api/admin/resources/${resourceId}`, input)
- deleteResource(resourceId) -> await api.delete(`/api/admin/resources/${resourceId}`)

MODUL LAIN BERGANTUNG PADA DATA INI (jangan tukar nama/jenis): resource_id, title, resource_type, skill_name, skill_tags (MESTI array string).

Beri kod penuh untuk setiap fail, kemudian terangkan ringkas setiap bahagian supaya saya faham untuk pembentangan.
````
