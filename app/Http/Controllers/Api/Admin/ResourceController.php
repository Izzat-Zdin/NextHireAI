<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\LearningResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin · Learning Resource Management (A2): CRUD on learning_resources.
 *
 * Akses admin sahaja sudah dijaga oleh middleware 'admin' dalam routes/web.php
 * (App\Http\Middleware\EnsureUserIsAdmin → 403 {"message":"Administrators only."} untuk bukan admin).
 * Senarai resource untuk page admin guna GET /api/learning/resources (LearningController::resources).
 */
class ResourceController extends Controller
{
    // TODO (Wani): nilai resource_type yang dibenarkan (sama dengan CHECK constraint DB):
    // private const TYPES = 'Course,Tutorial,Project,Cert,Article,Video,Practice';

    /** POST /api/admin/resources */
    public function store(Request $request): JsonResponse
    {
        // TODO (Wani):
        // 1. Validate (mod cipta, semua medan utama 'required'):
        //      'title'         => required, string, max:200
        //      'resource_type' => required, in:Course,Tutorial,Project,Cert,Article,Video,Practice
        //      'skill_name'    => required, string, max:120
        //      'resource_url'  => nullable, url, max:2000
        //      'skill_tags'    => sometimes, array
        //      'skill_tags.*'  => string, max:60
        //    Cadangan: satu private function validated(Request $request, bool $creating): array
        //    yang guna $creating ? 'required' : 'sometimes' untuk title/resource_type/skill_name.
        // 2. LearningResource::create($data) (resource_id dijana uuid).
        // 3. Pulangkan response()->json($row->fresh(), 201).
        return response()->json(['message' => 'Belum dibina (TODO)'], 501);
    }

    /** PUT /api/admin/resources/{resource} */
    public function update(Request $request, LearningResource $resource): JsonResponse
    {
        // TODO (Wani):
        // 1. Validate dengan peraturan yang sama seperti store(), TETAPI title/resource_type/skill_name
        //    jadi 'sometimes' (boleh hantar sebahagian medan sahaja). resource_url & skill_tags sama.
        // 2. $resource->fill($data)->save().
        // 3. Pulangkan response()->json($resource->fresh()) (status 200).
        return response()->json(['message' => 'Belum dibina (TODO)'], 501);
    }

    /** DELETE /api/admin/resources/{resource} */
    public function destroy(LearningResource $resource): JsonResponse
    {
        // TODO (Wani):
        // 1. $resource->delete(). Baris learning_progress yang merujuk resource ini terpadam sendiri
        //    (foreign key ON DELETE CASCADE dalam database).
        // 2. Pulangkan response()->json(null, 204).
        return response()->json(['message' => 'Belum dibina (TODO)'], 501);
    }
}
