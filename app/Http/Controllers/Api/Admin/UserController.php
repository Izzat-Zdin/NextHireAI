<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\InterviewSessionSummary;
use App\Models\LearningProgress;
use App\Models\Resume;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** Admin · User Management (A1). All routes sit behind the `admin` middleware. */
class UserController extends Controller
{
    private const RECENT_SESSIONS = 8;

    /** GET /api/admin/users?search&role&status&page&pageSize */
    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(100, max(1, (int) $request->query('pageSize', 20)));
        $search = trim((string) $request->query('search', ''));
        $role = (string) $request->query('role', '');
        $status = (string) $request->query('status', '');

        $query = User::query();

        if ($search !== '') {
            $like = '%'.addcslashes($search, '%_\\').'%';
            $query->where(fn ($q) => $q->where('full_name', 'ilike', $like)->orWhere('email', 'ilike', $like));
        }

        if (in_array($role, ['user', 'admin'], true)) {
            $query->where('role', $role);
        }

        if (in_array($status, ['active', 'inactive'], true)) {
            $query->where('status', $status);
        }

        $total = (clone $query)->count();

        $rows = $query->orderByDesc('created_at')->forPage($page, $pageSize)->get()
            ->map(fn (User $user) => $user->toProfileArray());

        return response()->json(['rows' => $rows, 'total' => $total, 'page' => $page, 'pageSize' => $pageSize]);
    }

    /** GET /api/admin/users/stats */
    public function stats(): JsonResponse
    {
        return response()->json([
            'total' => User::count(),
            'active' => User::where('status', 'active')->count(),
            'inactive' => User::where('status', 'inactive')->count(),
            'admins' => User::where('role', 'admin')->count(),
            'newThisWeek' => User::where('created_at', '>=', now()->subDays(7))->count(),
        ]);
    }

    /** GET /api/admin/users/{user} */
    public function show(User $user): JsonResponse
    {
        return response()->json($user->toProfileArray());
    }

    /** GET /api/admin/users/{user}/activity */
    public function activity(User $user): JsonResponse
    {
        $resumeCount = Resume::where('user_id', $user->user_id)->count();
        $latestResume = Resume::where('user_id', $user->user_id)
            ->orderByDesc('analyzed_at')
            ->first(['overall_score', 'analyzed_at']);

        $sessions = InterviewSessionSummary::where('user_id', $user->user_id)
            ->orderByDesc('created_at')
            ->limit(500)
            ->get();
        $finished = $sessions->where('status', 'Finish');
        $scored = $finished->whereNotNull('average_score')->pluck('average_score');
        $latestFinished = $finished->map(fn ($row) => $row->completed_at ?? $row->created_at)->sortDesc()->first();

        $statuses = LearningProgress::where('user_id', $user->user_id)->pluck('status');

        return response()->json([
            'resumes' => [
                'count' => $resumeCount,
                'latestScore' => $latestResume ? (int) round($latestResume->overall_score) : null,
                'latestAt' => optional($latestResume?->analyzed_at)->toISOString(),
            ],
            'interviews' => [
                'total' => InterviewSessionSummary::where('user_id', $user->user_id)->count(),
                'finished' => $finished->count(),
                'averageScore' => $scored->count() ? (int) round($scored->avg()) : null,
                'latestAt' => $latestFinished ? $latestFinished->toISOString() : null,
            ],
            'learning' => [
                'completed' => $statuses->filter(fn ($s) => $s === 'Completed')->count(),
                'inProgress' => $statuses->filter(fn ($s) => $s === 'In Progress')->count(),
                'notStarted' => $statuses->filter(fn ($s) => $s === 'Not Started')->count(),
            ],
            'recentSessions' => $sessions->take(self::RECENT_SESSIONS)->values(),
        ]);
    }

    /** PATCH /api/admin/users/{user}/status  body: { status } */
    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        $this->guardSelf($request, $user);

        $user->status = $data['status'];
        $user->updated_at = now();
        $user->save();

        return response()->json($user->fresh()->toProfileArray());
    }

    /** PATCH /api/admin/users/{user}/role  body: { role } */
    public function updateRole(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'role' => ['required', 'in:user,admin'],
        ]);

        $this->guardSelf($request, $user);

        $user->role = $data['role'];
        $user->updated_at = now();
        $user->save();

        return response()->json($user->fresh()->toProfileArray());
    }

    private function guardSelf(Request $request, User $user): void
    {
        if ($request->user()->user_id === $user->user_id) {
            throw ValidationException::withMessages([
                'user' => 'The change was not applied. Administrators cannot change their own role or status.',
            ]);
        }
    }
}