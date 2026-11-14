<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Admin · User Management (A1). All routes sit behind the `admin` middleware. */
class UserController extends Controller
{
    // TODO (Nada): tambah semula pemalar ini: private const RECENT_SESSIONS = 8;  (bilangan sesi terkini dalam activity())

    /** GET /api/admin/users?search&role&status&page&pageSize */
    public function index(Request $request): JsonResponse
    {
        // TODO (Nada): Senarai pengguna dengan carian, penapis dan paging.
        //   1. Baca query string:
        //        $page     = max(1, (int) $request->query('page', 1));
        //        $pageSize = min(100, max(1, (int) $request->query('pageSize', 20)));
        //        $search   = trim((string) $request->query('search', ''));
        //        $role     = (string) $request->query('role', '');
        //        $status   = (string) $request->query('status', '');
        //   2. $query = User::query();
        //   3. Jika $search tidak kosong: escape wildcard LIKE → $like = '%'.addcslashes($search, '%_\\').'%';
        //      $query->where(fn ($q) => $q->where('full_name', 'ilike', $like)->orWhere('email', 'ilike', $like));
        //      ('ilike' = tidak sensitif huruf besar/kecil di Postgres)
        //   4. Jika $role ialah 'user' atau 'admin' (in_array strict) → where('role', $role). Nilai lain diabaikan.
        //   5. Jika $status ialah 'active' atau 'inactive' → where('status', $status). Nilai lain diabaikan.
        //   6. $total = (clone $query)->count();
        //   7. $rows = $query->orderByDesc('created_at')->forPage($page, $pageSize)->get()
        //              ->map(fn (User $user) => $user->toProfileArray());
        //   8. return response()->json(['rows' => $rows, 'total' => $total, 'page' => $page, 'pageSize' => $pageSize]);
        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(100, max(1, (int) $request->query('pageSize', 20)));

        return response()->json(['rows' => [], 'total' => 0, 'page' => $page, 'pageSize' => $pageSize]);
    }

    /** GET /api/admin/users/stats */
    public function stats(): JsonResponse
    {
        // TODO (Nada): Kiraan ringkas untuk kad statistik di /admin/users.
        //   return response()->json([
        //       'total'       => User::count(),
        //       'active'      => User::where('status', 'active')->count(),
        //       'inactive'    => User::where('status', 'inactive')->count(),
        //       'admins'      => User::where('role', 'admin')->count(),
        //       'newThisWeek' => User::where('created_at', '>=', now()->subDays(7))->count(),
        //   ]);
        return response()->json(['total' => 0, 'active' => 0, 'inactive' => 0, 'admins' => 0, 'newThisWeek' => 0]);
    }

    /** GET /api/admin/users/{user} */
    public function show(User $user): JsonResponse
    {
        // TODO (Nada): Pulangkan seorang pengguna.
        //   {user} ialah route-model binding (UUID; id bukan UUID / tidak wujud → 404 automatik).
        //   return response()->json($user->toProfileArray());
        return response()->json(null, 404);
    }

    /** GET /api/admin/users/{user}/activity */
    public function activity(User $user): JsonResponse
    {
        // TODO (Nada): Ringkasan aktiviti pengguna (resume, temuduga, pembelajaran) untuk page detail admin.
        //   Models: App\Models\Resume, App\Models\InterviewSessionSummary (VIEW), App\Models\LearningProgress.
        //   1. $resumeCount  = Resume::where('user_id', $user->user_id)->count();
        //      $latestResume = Resume::where('user_id', $user->user_id)->orderByDesc('analyzed_at')->first(['overall_score', 'analyzed_at']);
        //   2. $sessions = InterviewSessionSummary::where('user_id', $user->user_id)->orderByDesc('created_at')->limit(500)->get();
        //      $finished = $sessions->where('status', 'Finish');
        //      $scored   = $finished->whereNotNull('average_score')->pluck('average_score');
        //      $latestFinished = $finished->map(fn ($row) => $row->completed_at ?? $row->created_at)->sortDesc()->first();
        //   3. $statuses = LearningProgress::where('user_id', $user->user_id)->pluck('status');
        //   4. Pulangkan:
        //      [
        //        'resumes' => [
        //          'count'       => $resumeCount,
        //          'latestScore' => $latestResume ? (int) round($latestResume->overall_score) : null,
        //          'latestAt'    => optional($latestResume?->analyzed_at)->toISOString(),
        //        ],
        //        'interviews' => [
        //          'total'        => InterviewSessionSummary::where('user_id', $user->user_id)->count(),
        //          'finished'     => $finished->count(),
        //          'averageScore' => $scored->count() ? (int) round($scored->avg()) : null,
        //          'latestAt'     => $latestFinished ? $latestFinished->toISOString() : null,
        //        ],
        //        'learning' => [
        //          'completed'  => bilangan status === 'Completed',
        //          'inProgress' => bilangan status === 'In Progress',
        //          'notStarted' => bilangan status === 'Not Started',
        //        ],
        //        'recentSessions' => $sessions->take(self::RECENT_SESSIONS)->values(),   // 8 sesi terbaru
        //      ]
        return response()->json([
            'resumes' => ['count' => 0, 'latestScore' => null, 'latestAt' => null],
            'interviews' => ['total' => 0, 'finished' => 0, 'averageScore' => null, 'latestAt' => null],
            'learning' => ['completed' => 0, 'inProgress' => 0, 'notStarted' => 0],
            'recentSessions' => [],
        ]);
    }

    /** PATCH /api/admin/users/{user}/status  body: { status } */
    public function updateStatus(Request $request, User $user): JsonResponse
    {
        // TODO (Nada): Aktif / nyahaktif akaun pengguna.
        //   1. Validate: 'status' => ['required', 'in:active,inactive'].
        //   2. Panggil guardSelf($request, $user) — admin TIDAK boleh tukar status diri sendiri (lihat di bawah).
        //   3. $user->status = $data['status']; $user->updated_at = now(); $user->save();
        //   4. return response()->json($user->fresh()->toProfileArray());  — 200
        //   (Pengguna 'inactive' akan dilog keluar oleh middleware EnsureUserIsActive pada request seterusnya.)
        return response()->json(['message' => 'Belum dibina (TODO)'], 501);
    }

    /** PATCH /api/admin/users/{user}/role  body: { role } */
    public function updateRole(Request $request, User $user): JsonResponse
    {
        // TODO (Nada): Tukar peranan pengguna (user ↔ admin).
        //   1. Validate: 'role' => ['required', 'in:user,admin'].
        //   2. Panggil guardSelf($request, $user).
        //   3. $user->role = $data['role']; $user->updated_at = now(); $user->save();
        //   4. return response()->json($user->fresh()->toProfileArray());  — 200
        return response()->json(['message' => 'Belum dibina (TODO)'], 501);
    }

    // TODO (Nada): Tambah semula method peribadi ini (peraturan sama seperti trigger DB asal):
    //   private function guardSelf(Request $request, User $user): void
    //   {
    //       if ($request->user()->user_id === $user->user_id) {
    //           throw ValidationException::withMessages([      // use Illuminate\Validation\ValidationException;
    //               'user' => 'The change was not applied. Administrators cannot change their own role or status.',
    //           ]);
    //       }
    //   }
    //   → menghasilkan 422 { "message": "The change was not applied. ...", "errors": { "user": ["The change was not applied. ..."] } }
}
