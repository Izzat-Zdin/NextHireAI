# Panduan Tim NextHire AI (baca ini dahulu)

Sistem NextHire AI sudah siap dan sedang live. Repo ini ialah **starter**: rupa (UI) semua page kekal, tetapi **logic dan database** untuk modul ahli kumpulan sudah dikosongkan. Setiap orang membina semula bahagian masing-masing supaya hasilnya **sama** dengan sistem asal.

## 1. Siapa buat apa

| Modul | Owner | Fail tugasan |
|---|---|---|
| M1 User Management (Profile, Forgot/Reset password) + A1 Admin Users | Nada | [TUGASAN-NADA.md](TUGASAN-NADA.md) |
| M2 AI Resume Analyzer | Shafinaz | [TUGASAN-SHAFINAZ.md](TUGASAN-SHAFINAZ.md) |
| M5 Learning Recommendation | Shafinaz & Wani | [TUGASAN-SHAFINAZ-WANI.md](TUGASAN-SHAFINAZ-WANI.md) |
| A2 Admin Learning Resources | Wani | [TUGASAN-WANI.md](TUGASAN-WANI.md) |
| M3 Mock Interview, M4 Readiness, M6 Progress, Dashboard | Izzat | Sudah siap (jadi **contoh rujukan**) |

Login, register dan logout **sudah berfungsi**, supaya semua orang boleh masuk dan menguji page masing-masing.

## 2. Apa maksud "dikosongkan"

Fail, nama fungsi, route dan jenis data **masih ada**. Hanya isi fungsi dikosongkan dan diganti dengan arahan `// TODO (Nama): ...`. Contoh:

```php
public function index(Request $request): JsonResponse
{
    // TODO (Shafinaz): Senaraikan resume milik pengguna yang log masuk...
    return response()->json([]);
}
```

Tugas anda: **ganti setiap `TODO` dengan kod sebenar.** Jangan tukar nama fail, nama fungsi, route atau `types.ts`. Modul Izzat (Dashboard, Readiness, Mock Interview) membaca data anda menggunakan nama-nama itu.

## 3. Setup di komputer (sekali sahaja)

1. Pasang PHP 8.3, Composer, Node.js 20+ dan pnpm.
2. Clone repo dan masuk ke branch anda:
   ```bash
   git clone https://github.com/Izzat-Zdin/NextHireAI.git
   cd NextHireAI
   git checkout <branch-anda>      # contoh: nada/user-management
   ```
3. Pasang dependencies:
   ```bash
   composer install
   pnpm install
   ```
4. `copy .env.example .env`, kemudian `php artisan key:generate`. Minta Izzat nilai `DB_*` (database), atau guna database Postgres sendiri dan jalankan migration anda.
5. Jalankan app (dua terminal):
   ```bash
   php artisan serve
   ```
   ```bash
   pnpm dev
   ```
   Buka http://localhost:8000 dan tekan "Test user" di page login.

## 4. Cara sistem berfungsi (aliran data)

```
React page  →  service (.ts)  →  route (routes/web.php)  →  middleware  →  Controller (validate + Policy)  →  Model (Eloquent)  →  PostgreSQL
     ↑                                                                                                                              │
     └──────────────────────────────────────────────────  JSON  ←─────────────────────────────────────────────────────────────────────┘
```

**Contoh siap untuk ditiru (modul Izzat):**
- Controller: `app/Http/Controllers/Api/InterviewSessionController.php`
- Policy: `app/Policies/InterviewSessionPolicy.php`
- Service React: `resources/js/modules/mock-interview/services/interviewService.ts`

## 5. Cara kerja harian

1. Kerja dalam **branch anda sahaja** dan **folder modul anda sahaja**.
2. Commit kerap dengan mesej yang jelas:
   ```bash
   git add .
   git commit -m "M2: ResumeController index dan store"
   git push
   ```
3. Ambil perubahan terkini dari main sekali-sekala:
   ```bash
   git pull origin main
   ```
4. Sebelum push, pastikan tiada ralat:
   ```bash
   pnpm typecheck
   ```

## 6. Bila siap: Pull Request

1. Di GitHub, tekan **Compare & pull request** (dari branch anda ke `main`).
2. Tulis apa yang sudah dibuat, dan tandakan checklist dalam fail tugasan anda.
3. Izzat akan semak tab **Files changed**. Kalau ada fail di luar modul anda yang berubah, PR akan diminta dibetulkan.
4. Selepas Izzat **Approve**, PR di-merge ke `main`.

## 7. Guna AI (Claude / ChatGPT)

Setiap fail tugasan ada bahagian **🤖 PROMPT untuk AI** di hujungnya. Salin keseluruhan blok itu ke AI. Prompt itu sudah mengandungi spec penuh (endpoint, validation, bentuk JSON, jadual database), jadi kod yang dijana akan selari dengan sistem. **Tetap baca dan faham kod yang dijana**, kerana anda perlu menerangkannya semasa pembentangan.
