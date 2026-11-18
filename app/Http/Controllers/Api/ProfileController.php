<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules;

/** Module 1: the signed-in user's own users row. Only full_name is editable; role/status are admin-managed. */
class ProfileController extends Controller
{
    /** GET /api/profile */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json($user->toProfileArray());
    }

    /** PUT /api/profile  body: { full_name } */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'min:1', 'max:120'],
        ]);

        $user = $request->user();

        $user->full_name = trim(preg_replace('/\s+/', ' ', $data['full_name']));
        $user->updated_at = now();
        $user->save();

        return response()->json($user->fresh()->toProfileArray());
    }

    /** PUT /api/profile/password  body: { password, password_confirmation } */
    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'password' => ['required', 'confirmed', Rules\Password::min(8)],
        ]);

        $request->user()->forceFill(['password' => $data['password']])->save();

        return response()->json(['ok' => true]);
    }
}