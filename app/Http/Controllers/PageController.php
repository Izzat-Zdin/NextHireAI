<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Renders the React pages (resources/js/modules/**). Pages load their data from the
 * JSON API (routes/web.php, "api" prefix) exactly like the original app did from Supabase,
 * so the page components are unchanged.
 */
class PageController extends Controller
{
    /** "/" takes admins to user management; everyone else gets the dashboard. */
    public function home(Request $request): Response|RedirectResponse
    {
        if ($request->user()->isAdmin()) {
            return redirect('/admin/users');
        }

        return Inertia::render('dashboard/DashboardPage');
    }

    public function profile(): Response
    {
        return Inertia::render('m1-user-management/pages/ProfilePage');
    }

    public function resume(): Response
    {
        return Inertia::render('m2-ai-resume-analyzer/pages/ResumeAnalyzerPage');
    }

    public function resumeHistory(): Response
    {
        return Inertia::render('m2-ai-resume-analyzer/pages/ResumeHistoryPage');
    }

    public function resumeResult(string $resumeId): Response
    {
        return Inertia::render('m2-ai-resume-analyzer/pages/ResumeResultPage');
    }

    public function interview(): Response
    {
        return Inertia::render('m3-mock-interview/pages/MockInterviewPage');
    }

    public function interviewHistory(): Response
    {
        return Inertia::render('m3-mock-interview/pages/InterviewHistoryPage');
    }

    public function interviewSession(string $sessionId): Response
    {
        return Inertia::render('m3-mock-interview/pages/InterviewSessionPage');
    }

    public function assessment(): Response
    {
        return Inertia::render('m4-interview-readiness/pages/ReadinessPage');
    }

    public function learning(): Response
    {
        return Inertia::render('m5-learning-recommendation/pages/LearningPage');
    }

    public function learningResource(string $resourceId): Response
    {
        return Inertia::render('m5-learning-recommendation/pages/ResourceDetailPage');
    }

    public function progress(): Response
    {
        return Inertia::render('m6-recommendation-tracking/pages/ProgressPage');
    }

    public function adminUsers(): Response
    {
        return Inertia::render('admin/a1-user-management/pages/AdminUsersPage');
    }

    public function adminUser(string $userId): Response
    {
        return Inertia::render('admin/a1-user-management/pages/AdminUserDetailPage');
    }

    public function adminResources(): Response
    {
        return Inertia::render('admin/a2-learning-resources/pages/AdminResourcesPage');
    }
}
