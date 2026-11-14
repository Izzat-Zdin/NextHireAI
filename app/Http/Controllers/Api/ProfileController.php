<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Module 1: the signed-in user's own users row. Only full_name is editable; role/status are admin-managed. */
class ProfileController extends Controller
{
    /** GET /api/profile */
    public function show(Request $request): JsonResponse
    {
        // TODO (Nada): Pulangkan profil pengguna yang sedang log masuk.
        //   1. Ambil pengguna dengan $request->user() (route ini sudah di belakang middleware auth, active, verified).
        //   2. Pulangkan response()->json($user->toProfileArray()) — status 200.
        //      Bentuk: { user_id, full_name, email, status, role, created_at, updated_at, avatar_url, google_id }
        //      (created_at / updated_at dalam format ISO, cth "2026-01-05T08:00:00.000000Z").
        return response()->json(null, 404);
    }

    /** PUT /api/profile  body: { full_name } */
    public function update(Request $request): JsonResponse
    {
        // TODO (Nada): Kemas kini nama penuh pengguna sendiri (hanya full_name boleh diubah).
        //   1. Validate: 'full_name' => ['required', 'string', 'min:1', 'max:120'].
        //      (Gagal → Laravel pulangkan 422 { message, errors: { full_name: [...] } } secara automatik.)
        //   2. $user = $request->user();
        //   3. Bersihkan nama: trim(preg_replace('/\s+/', ' ', $data['full_name'])) — ruang berganda jadi satu ruang.
        //   4. Set $user->full_name = nama bersih; $user->updated_at = now(); $user->save();
        //   5. JANGAN benarkan email, role atau status diubah di sini (role/status hanya oleh admin).
        //   6. Pulangkan response()->json($user->fresh()->toProfileArray()) — status 200.
        return response()->json(['message' => 'Belum dibina (TODO)'], 501);
    }

    /** PUT /api/profile/password  body: { password, password_confirmation } — change password while signed in (email accounts). */
    public function updatePassword(Request $request): JsonResponse
    {
        // TODO (Nada): Tukar kata laluan pengguna yang sedang log masuk.
        //   1. Validate: 'password' => ['required', 'confirmed', Rules\Password::min(8)]
        //      (import: use Illuminate\Validation\Rules;). 'confirmed' bermaksud password_confirmation mesti sama.
        //   2. $request->user()->forceFill(['password' => $data['password']])->save();
        //      (Model User ada cast 'password' => 'hashed', jadi Laravel hash sendiri — jangan Hash::make dua kali.)
        //   3. Pulangkan response()->json(['ok' => true]) — status 200.
        return response()->json(['message' => 'Belum dibina (TODO)'], 501);
    }
}
