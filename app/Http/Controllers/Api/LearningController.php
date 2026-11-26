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
        // Done by Izzat (read only): all rows, A–Z, skill_tags as a JSON array via the model cast.
        return response()->json(
            LearningResource::orderBy('title')->get()->map(fn (LearningResource $r) => $this->present($r))->values()
        );
    }

    /** GET /api/learning/resources/{resource} */
    public function resource(LearningResource $resource): JsonResponse
    {
        // Done by Izzat (read only): route model binding already returns 404 for an unknown id.
        return response()->json($this->present($resource));
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

    /** One resource in the shape the Learning page expects. */
    private function present(LearningResource $r): array
    {
        return [
            'resource_id' => $r->resource_id,
            'title' => $r->title,
            'resource_type' => $r->resource_type,
            'skill_name' => $r->skill_name,
            'resource_url' => $r->resource_url,
            'skill_tags' => $r->skill_tags,
        ];
    }
}
