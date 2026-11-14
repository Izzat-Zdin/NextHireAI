# Tugasan Shafinaz — M2 AI Resume Analyzer

Baca [PANDUAN-TIM.md](PANDUAN-TIM.md) dahulu (setup, aliran data, peraturan umum).

## 1. Modul & owner

| Modul | Owner | Page |
|---|---|---|
| **M2 AI Resume Analyzer** | **Shafinaz** | `/resume`, `/resume/history`, `/resume/{id}` |

Pengguna upload resume (PDF / DOCX / TXT) atau paste teks, pilih target role (boleh tambah job description). Browser baca teks fail, kira skor (rule-based, tiada AI luar), kemudian simpan hasil ke table `resume` dan fail asal ke storage. Pengguna boleh lihat sejarah, buka laporan, download fail asal dan padam laporan.

## 2. Fail yang sudah siap (jangan ubah)

| Jenis | Fail |
|---|---|
| Pages | `resources/js/modules/ai-resume-analyzer/pages/ResumeAnalyzerPage.tsx`, `ResumeHistoryPage.tsx`, `ResumeResultPage.tsx` |
| Components | `resources/js/modules/ai-resume-analyzer/components/AnalysisProgress.tsx`, `DeleteResumeModal.tsx`, `ResumeUploadZone.tsx`, `ScoreSummaryCard.tsx` |
| Types | `resources/js/modules/ai-resume-analyzer/types.ts`, `resources/js/lib/types.ts` (`ResumeRow`, `ResumeScores`, `ResumeSuggestion`) |
| Routes | `routes/web.php` (bahagian "Module 2") |
| Model | `app/Models/Resume.php` — **sudah siap**, kekal kerana Admin `UserController` dan `User::resumes()` bergantung padanya |
| Cast | `app/Casts/PgTextArray.php` (tukar Postgres `text[]` ⇄ array PHP) |
| Helper | `resources/js/lib/api.ts`, `lib/format.ts` (`clamp`, `scoreLabel`), `lib/skills.ts` (`SKILLS`, `ROLE_SKILLS`, `detectSkillTags`, `roleSkills`, `skillLabel`), `lib/insights.ts` (`fetchResumes`) |
| Config | `config/nexthire.php` → `resume_disk` (default `local`), `resume_folder` (default `resumes`) |

## 3. Fail yang perlu diisi (checklist)

Setiap fail ada komen `// TODO (Shafinaz): ...` yang terangkan langkah tepat kod asal. Baca komen itu.

### `app/Http/Controllers/Api/ResumeController.php`
- [ ] `index` — senarai resume milik user, terbaru dahulu (`uploaded_at` desc), `limit` 1–500 (default 50).
- [ ] `store` — validate, simpan fail (jika boleh) ke `resumes/<user_id>/<timestamp>-<nama>`, cipta row, pulang `{ row, warning }` 201.
- [ ] `show` — `authorize('view')`, pulang satu row.
- [ ] `destroy` — `authorize('delete')`, padam row + fail, 204.
- [ ] `downloadUrl` — cari row milik user ikut `path`, semak fail wujud, pulang signed URL 60 saat.
- [ ] `download` — `authorize('view')`, stream fail dengan nama asal.
- [ ] helper private `sanitizeFileName` (tambah semula).

### `app/Policies/ResumePolicy.php`
- [ ] `view` — pemilik **atau** admin.
- [ ] `delete` — pemilik sahaja.

### `resources/js/modules/ai-resume-analyzer/services/resumeService.ts`
- [ ] `buildFeedback` — summary + 3 suggestion pertama (`• title: detail`), dipisah `\n`.
- [ ] `sanitizeFileName` — nama fail selamat (sama dengan versi PHP).
- [ ] `uploadAndSave` — bina `FormData`, `api.postForm("/api/resumes")`.
- [ ] `getResume` — `null` jika id bukan UUID, selain itu `api.getOrNull`.
- [ ] `listResumes` — `GET /api/resumes?limit=`.
- [ ] `deleteResume` — `DELETE /api/resumes/{id}`.
- [ ] `getDownloadUrl` — `GET /api/resumes/download-url?path=` → `url`.

### `resources/js/modules/ai-resume-analyzer/services/resumeParser.ts`
(Constants `MAX_FILE_SIZE`, `MIN_TEXT_LENGTH`, `ACCEPTED_EXTENSIONS`, `ACCEPT_ATTRIBUTE` sudah ada.)
- [ ] `formatFileSize` — `—` / `B` / `KB` / `MB`.
- [ ] `validateResumeFile` — mesej ralat untuk `.doc`, jenis lain, fail kosong, > 5 MB; selain itu `null`.
- [ ] `normaliseText` — kemas whitespace, kekalkan baris baru.
- [ ] `extractPdf` (pdfjs-dist) dan `extractDocx` (mammoth) — helper private, tambah semula.
- [ ] `parseResumeFile` — validate → extract → normalise → semak ≥ 100 aksara.
- [ ] `parsePastedText` — normalise → semak ≥ 100 aksara.

### `resources/js/modules/ai-resume-analyzer/services/resumeAnalysis.ts` (enjin skor)
(Semua kamus/regex sudah disimpan sebagai data: `SCORE_WEIGHTS`, `STOPWORDS`, `ACTION_VERBS`, `WEAK_PHRASES`, `BUZZWORDS`, `SKILL_KEYWORD_SET`, `HEADING_PATTERNS`, `SKILL_EVIDENCE`, `BULLET_RE`, `EMAIL_RE`, `LINK_RE`, `MONTHS_RE`, `PRIORITY_ORDER`.)
- [ ] helper private (`words`, `hasPhone`, `headingKey`, `isQuantified`, `termInResume`, ...).
- [ ] `extractJobTerms` — term paling kerap dalam job description.
- [ ] `countWords` — bilangan perkataan.
- [ ] `analyzeResume` — 5 skor + overall + strengths/weaknesses/suggestions/summary (langkah 0–12 dalam komen).

## 4. Database

Table `public.resume` (sudah wujud dalam database Supabase bersama — **jangan** jalankan migration ke atasnya).

| Kolum | Jenis | Null | Default | Kunci / constraint |
|---|---|---|---|---|
| `analysis_id` | uuid | NO | `gen_random_uuid()` | **PRIMARY KEY** (`resumes_pkey`) |
| `user_id` | uuid | NO | — | **FK** → `users(user_id)` `ON DELETE CASCADE` (`resumes_user_id_fkey`) |
| `file_name` | text | NO | — | |
| `file_path` | text | YES | NULL | |
| `file_size` | integer | YES | NULL | |
| `target_role` | text | NO | — | |
| `job_description` | text | YES | NULL | |
| `extracted_text` | text | YES | NULL | |
| `overall_score` | double precision | NO | `0` | CHECK `overall_score >= 0 AND overall_score <= 100` (`resumes_overall_score_check`) |
| `scores` | jsonb | NO | `'{}'::jsonb` | |
| `detected_skills` | text[] | NO | `'{}'::text[]` | |
| `matched_keywords` | text[] | NO | `'{}'::text[]` | |
| `missing_keywords` | text[] | NO | `'{}'::text[]` | |
| `sections` | jsonb | NO | `'{}'::jsonb` | |
| `strengths` | jsonb | NO | `'[]'::jsonb` | |
| `weaknesses` | jsonb | NO | `'[]'::jsonb` | |
| `suggestions` | jsonb | NO | `'[]'::jsonb` | |
| `summary` | text | YES | NULL | |
| `uploaded_at` | timestamptz | NO | `now()` | |
| `analyzed_at` | timestamptz | NO | `now()` | |
| `feedback` | text | YES | NULL | |

Index: `idx_resume_user` pada `(user_id, uploaded_at DESC)`. Tiada trigger.

**Tugas migration:** tulis satu migration Laravel dalam `database/migrations/` (folder ini belum wujud — cipta), contoh `2026_11_13_000002_create_resume_table.php`, yang mencipta table ini **sama tepat** untuk database local baharu:
- `uuid('analysis_id')->primary()->default(DB::raw('gen_random_uuid()'))`
- `foreignUuid('user_id')->constrained('users', 'user_id')->cascadeOnDelete()` (table `users` mesti wujud dahulu)
- kolum `text[]`: Laravel tiada jenis ini — guna `DB::statement("ALTER TABLE resume ADD COLUMN detected_skills text[] NOT NULL DEFAULT '{}'::text[]")` (begitu juga `matched_keywords`, `missing_keywords`)
- jsonb dengan default: `jsonb('scores')->default(DB::raw("'{}'::jsonb"))`, `jsonb('strengths')->default(DB::raw("'[]'::jsonb"))`
- CHECK: `DB::statement('ALTER TABLE resume ADD CONSTRAINT resumes_overall_score_check CHECK (overall_score >= 0 AND overall_score <= 100)')`
- index: `DB::statement('CREATE INDEX idx_resume_user ON resume (user_id, uploaded_at DESC)')`
- **tiada** `timestamps()` (`created_at`/`updated_at` tidak wujud; model guna `$timestamps = false`).
- `down()` → `Schema::dropIfExists('resume')`.

## 5. API

Semua route di bawah ada middleware `auth`, `active`, `verified` (perlu log masuk). `{resume}` mesti UUID, kalau tidak 404.

### `GET /api/resumes?limit=50`
- Input: `limit` (pilihan, int, dihadkan 1–500, default 50).
- Output 200: array row milik user, `uploaded_at` terbaru dahulu.

### `POST /api/resumes` (multipart/form-data)
- Input + validation:
  - `file_name` required|string|max:255
  - `file_size` nullable|integer|min:0
  - `target_role` required|string|max:120
  - `job_description` nullable|string (kosong → simpan `null`)
  - `extracted_text` nullable|string (dipotong 20 000 aksara)
  - `analysis` required|json (`ResumeAnalysis` dalam bentuk JSON string)
  - `feedback` nullable|string
  - `analyzed_at` nullable|date (default sekarang)
  - `file` pilihan — **tidak** divalidate. Diterima jika `isValid()`, extension `pdf|doc|docx|txt`, ≤ 5 MB. Disimpan dengan `storeAs(config('nexthire.resume_folder').'/'.$user_id, now()->getTimestampMs().'-'.sanitizeFileName(nama), config('nexthire.resume_disk'))`.
  - Jika fail tak dapat disimpan: analisis **tetap** disimpan, `file_path = null`, dan `warning` = `"Your analysis was saved, but the original file could not be stored. Download will be unavailable for this report."`
- Output 201:
```json
{
  "row": {
    "analysis_id": "6f1c2a9e-1b2c-4d3e-8f90-123456789abc",
    "user_id": "0b7e...-uuid",
    "file_name": "Ali_Resume.pdf",
    "file_path": "resumes/0b7e...-uuid/1731480000000-Ali_Resume.pdf",
    "file_size": 84213,
    "target_role": "Data Analyst",
    "job_description": null,
    "extracted_text": "ALI BIN ABU\nali@example.com ...",
    "overall_score": 72,
    "scores": { "ats": 80, "keywords": 66, "impact": 70, "structure": 85, "clarity": 64 },
    "detected_skills": ["sql", "excel", "python"],
    "matched_keywords": ["SQL & databases", "Excel & spreadsheets"],
    "missing_keywords": ["Statistics", "Data visualisation"],
    "sections": { "contact": true, "summary": true, "experience": true, "education": true, "skills": true, "projects": false, "certifications": false },
    "strengths": ["Good length — 412 words fits on one to two pages."],
    "weaknesses": ["Few measurable results — most lines describe tasks rather than outcomes."],
    "suggestions": [{ "title": "Show Statistics evidence", "detail": "Add a statistics example: ...", "priority": "High" }],
    "summary": "Your resume scores 72/100 for Data Analyst (strong foundation). ...",
    "feedback": "Your resume scores 72/100 ...\n• Show Statistics evidence: ...",
    "uploaded_at": "2026-11-13T08:00:00.000000Z",
    "analyzed_at": "2026-11-13T08:00:00.000000Z"
  },
  "warning": null
}
```
- 422 jika validation gagal.

### `GET /api/resumes/{resume}`
- `authorize('view')` (pemilik atau admin). 200 → satu row (bentuk sama seperti `row` di atas). 403 bukan pemilik. 404 tiada.

### `DELETE /api/resumes/{resume}`
- `authorize('delete')` (pemilik sahaja). Padam row, kemudian fail di disk (jika `file_path` ada). 204 tanpa body. 403 / 404.

### `GET /api/resumes/download-url?path=<file_path>`
- Cari row `user_id` = user semasa **dan** `file_path` = `path`, kalau tiada 404.
- Jika fail tiada di disk → 404 dengan mesej `"The original file is not stored in this app (it was uploaded through the previous version). Analyse the resume again to keep a downloadable copy."`
- 200 → `{ "url": "https://.../resume/<analysis_id>/download?expires=...&signature=..." }` (dibuat dengan `URL::temporarySignedRoute('resume.download', now()->addSeconds(60), ['resume' => analysis_id])`).

### `GET /resume/{resume}/download` (page route, nama `resume.download`, middleware `signed`)
- URL tamat / diubah → 403 (oleh middleware). `authorize('view')`. Tiada `file_path` atau fail tiada → 404.
- 200 → stream fail (`$disk->download($file_path, $file_name)`).

## 6. Data yang modul lain guna (PENTING)

Modul lain membaca row `resume` melalui `GET /api/resumes` (fungsi `fetchResumes` dalam `resources/js/lib/insights.ts`) — **bukan** melalui servis anda. Maka endpoint `index` mesti pulangkan nama kolum dan jenis yang sama, susunan terbaru dahulu.

| Modul (owner) | Fail | Field yang dibaca |
|---|---|---|
| Dashboard (Izzat) | `modules/dashboard/DashboardPage.tsx` | `overall_score` (number), `target_role`, `analyzed_at`, `uploaded_at` (limit 10, ambil [0] dan [1]) |
| Readiness (Izzat) | `modules/interview-readiness/services/assessmentEngine.ts`, `pages/ReadinessPage.tsx` | `target_role`, `detected_skills` (string[] tag), `overall_score` |
| Mock Interview setup (Izzat) | `modules/mock-interview/MockInterviewModule.tsx` → `SetupPage.tsx`, `services/questions.ts` | `file_name`, `overall_score`, `target_role`, `detected_skills` (soalan berdasarkan skill resume) — `limit=1` |
| Progress (Izzat) | `modules/recommendation-tracking/services/progressInsights.ts`, `pages/ProgressPage.tsx` | `analysis_id`, `file_name`, `overall_score`, `detected_skills`, `analyzed_at`, `uploaded_at` |
| Learning (Shafinaz & Wani) | `modules/learning-recommendation/pages/LearningPage.tsx` + `lib/insights.ts` `deriveSkillGaps` | `target_role`, `detected_skills` (`limit=1`) |
| Profile (Nada) | `modules/user-management/pages/ProfilePage.tsx` | bilangan row (`limit=500`) |
| Admin activity (Nada) | `app/Http/Controllers/Api/Admin/UserController.php` `activity()` | Eloquent: `count()`, `overall_score` (cast float), `analyzed_at` (cast datetime) |

Jadi: `detected_skills` mesti array **tag** (contoh `"sql"`, `"data-analysis"`) dari `detectSkillTags`, bukan label. `overall_score` mesti nombor 0–100.

## 7. Contoh corak untuk ditiru (modul Izzat yang sudah siap)

| Corak Izzat | Untuk fail anda |
|---|---|
| `app/Http/Controllers/Api/InterviewSessionController.php` — `index` (where user_id + orderByDesc + limit), `store` (`$request->validate`, create, `json(..., 201)`), `show` (`$this->authorize('view', ...)`), `destroy` (`authorize('delete')`, `json(null, 204)`) | `ResumeController.php` |
| `app/Policies/InterviewSessionPolicy.php` — `view` = pemilik atau `isAdmin()`, `delete` = pemilik | `ResumePolicy.php` |
| `resources/js/modules/mock-interview/services/interviewService.ts` — `api.get`, `api.post`, `api.delete`, `api.getOrNull`, `qs()` | `resumeService.ts` |
| `resources/js/modules/interview-readiness/services/assessmentEngine.ts` — fungsi tulen (pure) yang kira skor berwajaran dengan `clamp` | `resumeAnalysis.ts` |

## 8. Cara uji

1. `php artisan serve` dan `pnpm dev`, buka http://localhost:8000, tekan **Test user** di page login.
2. Pergi `/resume`. Pilih target role (contoh *Data Analyst*), upload PDF resume (< 5 MB). Langkah "reading → analysing → saving" patut berjalan dan anda dibawa ke `/resume/<id>`.
3. Semak laporan: skor overall, 5 skor (ATS, keyword, impact, structure, clarity), skill, keyword padan/tiada, strengths, weaknesses, suggestions.
4. Uji juga: DOCX, TXT, paste teks, fail `.doc` (mesti ditolak), fail > 5 MB (mesti ditolak), PDF scan (mesej "Could not read text…").
5. `/resume/history` — laporan baru muncul paling atas.
6. Dalam laporan, tekan **Download** — fail asal dimuat turun dengan nama asal. Fail ada di `storage/app/private/resumes/<user_id>/`.
7. Padam laporan (modal delete) — hilang dari history dan fail di storage dipadam.
8. Buka Dashboard, `/assessment` dan `/interview` — skor resume dan skill anda patut muncul.
9. Log masuk sebagai user lain dan cuba buka `/api/resumes/<id milik orang lain>` → 403.

## 9. Siap bila

- [ ] Tiada lagi `TODO (Shafinaz)` dalam 5 fail di atas.
- [ ] Migration `database/migrations/..._create_resume_table.php` berjalan pada database local kosong dan hasilnya sama dengan jadual seksyen 4.
- [ ] Semua langkah seksyen 8 lulus.
- [ ] Resume yang sama memberi skor yang sama seperti sistem live (https://www.nexthire.web.id).
- [ ] Dashboard / Readiness / Mock Interview / Progress memaparkan data resume.
- [ ] `pnpm typecheck` lulus dan `php -l` lulus untuk fail PHP anda.
- [ ] Tiada perubahan pada pages, components, `types.ts`, `routes/web.php`, `resources/js/lib/*`.

## 10. 🤖 PROMPT untuk AI

Salin keseluruhan blok di bawah ke Claude / ChatGPT, kemudian tampal isi fail yang diminta.

````text
Anda membantu saya membina semula Module 2 "AI Resume Analyzer" dalam app NextHire AI.
Stack: Laravel 12 (PHP 8.3) + Inertia 2 + React 19 + TypeScript, PostgreSQL (Supabase). Fail React guna helper `api` dari "@/lib/api" (api.get, api.getOrNull, api.postForm, api.delete) dan `qs` untuk query string.

PERATURAN:
- JANGAN ubah UI (pages/components), routes, types (types.ts, lib/types.ts), nama fail, nama fungsi, parameter atau return type. Hanya isi badan fungsi yang ada komen "TODO (Shafinaz)".
- Ikut corak fail rujukan yang saya tampal: InterviewSessionController.php, InterviewSessionPolicy.php, interviewService.ts.
- Model app/Models/Resume.php sudah siap (table 'resume', PK 'analysis_id' uuid string, $timestamps=false, $guarded=[], casts: overall_score float, file_size integer, scores/sections/strengths/weaknesses/suggestions array (jsonb), detected_skills/matched_keywords/missing_keywords PgTextArray (Postgres text[]), uploaded_at/analyzed_at datetime). Relation user().
- Fail yang perlu ditulis: app/Http/Controllers/Api/ResumeController.php, app/Policies/ResumePolicy.php, resources/js/modules/ai-resume-analyzer/services/resumeService.ts, resumeParser.ts, resumeAnalysis.ts, dan satu migration baharu.

TABLE public.resume:
analysis_id uuid PK default gen_random_uuid(); user_id uuid NOT NULL FK users(user_id) ON DELETE CASCADE;
file_name text NOT NULL; file_path text NULL; file_size integer NULL; target_role text NOT NULL; job_description text NULL;
extracted_text text NULL; overall_score double precision NOT NULL default 0 CHECK 0..100 (resumes_overall_score_check);
scores jsonb NOT NULL default '{}'; detected_skills/matched_keywords/missing_keywords text[] NOT NULL default '{}';
sections jsonb NOT NULL default '{}'; strengths/weaknesses/suggestions jsonb NOT NULL default '[]'; summary text NULL;
uploaded_at timestamptz NOT NULL default now(); analyzed_at timestamptz NOT NULL default now(); feedback text NULL.
Index idx_resume_user (user_id, uploaded_at DESC). Tiada created_at/updated_at. Migration: guna DB::statement untuk text[], CHECK dan index DESC.

ENDPOINTS (semua perlu login; {resume} = UUID):
1. GET /api/resumes?limit= -> limit clamp 1..500 default 50; Resume::where(user_id)->orderByDesc('uploaded_at')->limit()->get(); 200 array.
2. POST /api/resumes (multipart). Validate: file_name required|string|max:255; file_size nullable|integer|min:0; target_role required|string|max:120; job_description nullable|string; extracted_text nullable|string; analysis required|json; feedback nullable|string; analyzed_at nullable|date. 'file' pilihan, tidak divalidate: terima jika isValid(), extension (client ext atau dari file_name) dalam pdf/doc/docx/txt, saiz <= 5*1024*1024. Simpan: storeAs(config('nexthire.resume_folder').'/'.user_id, now()->getTimestampMs().'-'.sanitizeFileName(originalName), config('nexthire.resume_disk')) dalam try/catch. Jika gagal: file_path null dan warning = "Your analysis was saved, but the original file could not be stored. Download will be unavailable for this report." Create row: overall_score = clamp 0..100 dari analysis.overall_score; scores & sections = new stdClass jika kosong (supaya {} bukan []); array lain ?? []; job_description '' -> null; extracted_text mb_substr 0..20000; uploaded_at now(); analyzed_at = input atau now(). Return json(['row' => $row->fresh(), 'warning' => $warning], 201).
3. GET /api/resumes/{resume} -> authorize('view') -> 200 row.
4. DELETE /api/resumes/{resume} -> authorize('delete'); simpan file_path; delete row; jika ada path Storage::disk(resume_disk)->delete(path); json(null, 204).
5. GET /api/resumes/download-url?path= -> Resume where user_id = current & file_path = path ->firstOrFail(); abort_unless(disk->exists(file_path), 404, "The original file is not stored in this app (it was uploaded through the previous version). Analyse the resume again to keep a downloadable copy."); URL::temporarySignedRoute('resume.download', now()->addSeconds(60), ['resume' => analysis_id]); return {url}.
6. GET /resume/{resume}/download (middleware signed, name resume.download) -> authorize('view'); abort_unless(file_path, 404); abort_unless(disk->exists, 404); return $disk->download(file_path, file_name).
sanitizeFileName: pisah pada titik terakhir (index > 0); ext lowercase buang selain [a-z0-9.]; base: run selain [a-zA-Z0-9._-] -> '-', gabung '-' berulang, trim '-' dan '.', max 80 aksara, kosong -> 'resume'.
Policy: view = pemilik || $user->isAdmin(); delete = pemilik sahaja.

resumeService.ts: buildFeedback = [summary.trim(), ...3 suggestion pertama sebagai "• title: detail"].filter(Boolean).join("\n"); sanitizeFileName sama seperti PHP (+ normalize("NFKD")); uploadAndSave hantar FormData: file (nama disanitize), file_name (file?.name ?? "Pasted resume.txt"), file_size (file?.size ?? new Blob([text]).size), target_role, job_description (trim atau ""), extracted_text (slice 0..20000), analysis (JSON.stringify), feedback, analyzed_at (?? now ISO) -> api.postForm<SaveResumeResult>("/api/resumes"); getResume: null jika bukan UUID, api.getOrNull; listResumes: api.get(`/api/resumes${qs({limit})}`); deleteResume: api.delete(`/api/resumes/${id}`); getDownloadUrl: api.get<{url}>(`/api/resumes/download-url${qs({path})}`) -> url.

resumeParser.ts: pdfjs-dist (GlobalWorkerOptions.workerSrc = pdf.worker.min.mjs?url) untuk PDF (bina baris ikut koordinat y item, tambah space bila jurang x > 1, hasEOL -> \n, pages join "\n\n"), mammoth.extractRawText untuk DOCX, file.text() untuk TXT. validateResumeFile: ".doc" -> "Old .doc files are not supported. Save it as .docx or PDF and try again."; jenis lain -> "Unsupported file type. Upload a PDF, DOCX or TXT file."; size 0 -> "This file is empty."; > 5 MB -> `File is too large (${formatFileSize}). The maximum size is 5 MB.`. normaliseText: \r\n -> \n, nbsp -> space, [ \t\f\v]+ -> space, trim tiap baris, \n{3,} -> \n\n, trim. Teks < 100 aksara bukan-whitespace -> "Could not read text — scanned PDFs are not supported; try DOCX or paste text." (paste: `Paste at least 100 characters of resume text so we can analyse it.`). Ralat PasswordException / InvalidPDFException ada mesej khas.

resumeAnalysis.ts (kamus & regex sudah ada sebagai data; ikut langkah 0–12 dalam komen fail):
- keywords = round(clamp(10 + 90*keywordCoverage)); coverage = skill berwajaran (3 tag pertama roleSkills(role) berat 2, lain 1, tag dari JD berat 1); dengan JD: 0.6*skill + 0.4*term (15 term JD teratas).
- impact = 25 + min(1, quantRatio/0.35)*35 + min(1, actionRatio/0.5)*30 (+10 jika >=3 quantified & >=3 bermula action verb) - min(25, 5*weakPhrases); max 40 jika < 3 baris.
- structure: contact 15, experience 15 (atau projects 8), education 15, skills 15, summary 8, projects 8, certifications 4, panjang 300–900 = 12 (200–299/901–1200 = 6, >1200 = 2), bullets >=3 = 8 (>=1 = 4).
- clarity = 100 tolak penalti ayat panjang (>25), first-person (>1.5%), baris > 40 perkataan, perkataan berulang, buzzwords, tiada ayat; minimum 20.
- ats = email 20 + phone 10 + 12 per [experience||projects, education, skills] + simbol (<1.5% = 20, <4% = 10) + 14*keywordCoverage - table 10 - (<150 perkataan) 10.
- overall = round(keywords*.30 + impact*.25 + structure*.20 + clarity*.15 + ats*.10).
- strengths/weaknesses maks 6, suggestions maks 9 disusun High > Medium > Low; detected_skills = detectSkillTags(resume) (tag, bukan label).
Modul lain baca overall_score, target_role, detected_skills, file_name, analysis_id, uploaded_at, analyzed_at dari GET /api/resumes — kekalkan nama & jenis.

Sila tulis kod penuh untuk fail yang saya tampal, satu fail pada satu masa.
````
