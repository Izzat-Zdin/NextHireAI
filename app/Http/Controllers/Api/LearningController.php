<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LearningResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Module 5: learning resources (read for everyone signed in) and the user's own learning_progress rows.
 *
 * PENTING: GET /api/learning/resources dan GET /api/learning/progress juga dibaca oleh modul Izzat
 * (resources/js/lib/insights.ts → Dashboard, Readiness, Progress, Profile). Selagi TODO di bawah belum
 * siap, page-page itu akan nampak kosong (tiada resource / tiada progress).
 */
class LearningController extends Controller
{
    /** GET /api/learning/resources : the whole catalogue, A–Z. */
    public function resources(): JsonResponse
    {
        // TODO (Shafinaz & Wani):
        // 1. Ambil SEMUA baris learning_resources (tiada filter, tiada "active" flag dalam ERD).
        // 2. Susun ikut title menaik (A–Z): LearningResource::orderBy('title')->get().
        // 3. Pulangkan array JSON terus (status 200), setiap item:
        //    { resource_id, title, resource_type, skill_name, resource_url, skill_tags: string[] }
        //    skill_tags mesti keluar sebagai array JSON (guna cast App\Casts\PgTextArray dalam model).
        return response()->json([]);
    }

    /** GET /api/learning/resources/{resource} */
    public function resource(LearningResource $resource): JsonResponse
    {
        // TODO (Shafinaz & Wani):
        // 1. $resource sudah dicari oleh route model binding (primary key resource_id, uuid).
        //    Jika tiada, Laravel sendiri pulangkan 404.
        // 2. Pulangkan objek resource itu sebagai JSON (status 200), bentuk sama seperti satu item dalam resources().
        return response()->json(null, 404);
    }

    /** GET /api/learning/progress : the signed-in user's rows. */
    public function progress(Request $request): JsonResponse
    {
        // TODO (Shafinaz & Wani):
        // 1. Ambil baris learning_progress di mana user_id = $request->user()->user_id (hanya milik sendiri).
        // 2. Tiada susunan khas, tiada limit: LearningProgress::where('user_id', ...)->get().
        // 3. Pulangkan array JSON (status 200), setiap item:
        //    { progress_id, user_id, resource_id, status, progress_percent (integer), completed_at (ISO string atau null) }
        return response()->json([]);
    }

    /** PUT /api/learning/resources/{resource}/progress : upsert on (user_id, resource_id). */
    public function upsertProgress(Request $request, LearningResource $resource): JsonResponse
    {
        // TODO (Shafinaz & Wani):
        // 1. Validate body:
        //      'status'           => required, in:Not Started,In Progress,Completed
        //      'progress_percent' => required, integer, min:0, max:100
        //      'completed_at'     => nullable, date
        //    (Gagal validate → Laravel pulangkan 422 secara automatik.)
        // 2. Upsert pada kunci unik (user_id, resource_id) guna LearningProgress::updateOrCreate(
        //      ['user_id' => $request->user()->user_id, 'resource_id' => $resource->resource_id],
        //      ['status' => ..., 'progress_percent' => ..., 'completed_at' => $data['completed_at'] ?? null]
        //    ). Jika baris sudah ada → kemas kini; jika belum → cipta baru (progress_id dijana uuid).
        //    Server TIDAK mengira peraturan status/peratus; ia simpan apa yang dihantar. Peraturan
        //    (Completed = 100% + completed_at, dll.) dibuat oleh progressPatches dalam learningService.ts.
        // 3. Pulangkan baris terkini dari database: response()->json($row->fresh()) (status 200).
        return response()->json(['message' => 'Belum dibina (TODO)'], 501);
    }

    /** DELETE /api/learning/resources/{resource}/progress : remove from the plan. */
    public function removeProgress(Request $request, LearningResource $resource): JsonResponse
    {
        // TODO (Shafinaz & Wani):
        // 1. Padam baris learning_progress di mana user_id = pengguna semasa DAN resource_id = $resource->resource_id.
        //    (Hanya baris milik sendiri. Jika tiada baris, tetap OK.)
        // 2. Pulangkan response()->json(null, 204).
        return response()->json(['message' => 'Belum dibina (TODO)'], 501);
    }
}
