<?php

use App\Http\Controllers\Api\Admin\ResourceController as AdminResourceController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\InterviewSessionController;
use App\Http\Controllers\Api\InterviewTranscriptionController;
use App\Http\Controllers\Api\LearningController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ResumeController;
use App\Http\Controllers\PageController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Route-model-bound ids must look like UUIDs, so a bad id is a 404 instead of a
// Postgres "invalid input syntax for type uuid" 500.
foreach (['resume', 'session', 'resource', 'user'] as $uuidParam) {
    Route::pattern($uuidParam, '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}');
}

/*
|--------------------------------------------------------------------------
| Pages (Inertia) — same paths as the original React Router app
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'active', 'verified'])->group(function () {
    Route::get('/', [PageController::class, 'home'])->name('home');
    Route::get('/profile', [PageController::class, 'profile'])->name('profile');

    // Module 2: AI Resume Analyzer
    Route::get('/resume', [PageController::class, 'resume']);
    Route::get('/resume/history', [PageController::class, 'resumeHistory']);
    Route::get('/resume/{resumeId}', [PageController::class, 'resumeResult']);
    Route::get('/resume/{resume}/download', [ResumeController::class, 'download'])
        ->middleware('signed')->name('resume.download');

    // Module 3: AI Mock Interview Engine
    Route::get('/interview', [PageController::class, 'interview']);
    Route::get('/interview/history', [PageController::class, 'interviewHistory']);
    Route::get('/interview/{sessionId}', [PageController::class, 'interviewSession']);

    // Module 4: Interview & Career Readiness Assessment (computed live, nothing stored)
    Route::get('/assessment', [PageController::class, 'assessment']);

    // Module 5: Learning Recommendation
    Route::get('/learning', [PageController::class, 'learning']);
    Route::get('/learning/{resourceId}', [PageController::class, 'learningResource']);

    // Module 6: Recommendation & Progress Tracking
    Route::get('/progress', [PageController::class, 'progress']);

    // Admin
    Route::middleware('admin')->group(function () {
        Route::get('/admin/users', [PageController::class, 'adminUsers']);
        Route::get('/admin/users/{userId}', [PageController::class, 'adminUser']);
        Route::get('/admin/resources', [PageController::class, 'adminResources']);
    });

    /*
    |----------------------------------------------------------------------
    | JSON API used by the pages (replaces the direct Supabase queries)
    |----------------------------------------------------------------------
    */
    Route::prefix('api')->group(function () {
        // Module 1
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

        // Module 2
        Route::get('/resumes', [ResumeController::class, 'index']);
        Route::post('/resumes', [ResumeController::class, 'store']);
        Route::get('/resumes/download-url', [ResumeController::class, 'downloadUrl']);
        Route::get('/resumes/{resume}', [ResumeController::class, 'show']);
        Route::delete('/resumes/{resume}', [ResumeController::class, 'destroy']);

        // Module 3
        Route::get('/interview/sessions', [InterviewSessionController::class, 'index']);
        Route::post('/interview/sessions', [InterviewSessionController::class, 'store']);
        Route::get('/interview/sessions/{session}', [InterviewSessionController::class, 'show']);
        Route::post('/interview/sessions/{session}/answers', [InterviewSessionController::class, 'saveAnswer'])->middleware('throttle:120,1');
        Route::post('/interview/transcribe', [InterviewTranscriptionController::class, 'store'])->middleware('throttle:60,1');
        Route::post('/interview/sessions/{session}/resume', [InterviewSessionController::class, 'resume']);
        Route::post('/interview/sessions/{session}/finish', [InterviewSessionController::class, 'finish']);
        Route::post('/interview/sessions/{session}/cancel', [InterviewSessionController::class, 'cancel']);
        Route::post('/interview/sessions/{session}/pause', [InterviewSessionController::class, 'pause']);
        Route::delete('/interview/sessions/{session}', [InterviewSessionController::class, 'destroy']);

        // Module 5 (+ catalogue shared with 4 and 6)
        Route::get('/learning/resources', [LearningController::class, 'resources']);
        Route::get('/learning/resources/{resource}', [LearningController::class, 'resource']);
        Route::get('/learning/progress', [LearningController::class, 'progress']);
        Route::put('/learning/resources/{resource}/progress', [LearningController::class, 'upsertProgress']);
        Route::delete('/learning/resources/{resource}/progress', [LearningController::class, 'removeProgress']);

        // Admin
        Route::middleware('admin')->prefix('admin')->group(function () {
            Route::get('/users', [AdminUserController::class, 'index']);
            Route::get('/users/stats', [AdminUserController::class, 'stats']);
            Route::get('/users/{user}', [AdminUserController::class, 'show']);
            Route::get('/users/{user}/activity', [AdminUserController::class, 'activity']);
            Route::patch('/users/{user}/status', [AdminUserController::class, 'updateStatus']);
            Route::patch('/users/{user}/role', [AdminUserController::class, 'updateRole']);

            Route::post('/resources', [AdminResourceController::class, 'store']);
            Route::put('/resources/{resource}', [AdminResourceController::class, 'update']);
            Route::delete('/resources/{resource}', [AdminResourceController::class, 'destroy']);
        });
    });
});

// Unknown paths go home (the React app redirected "*" to "/").
// Unknown page → home (as the React Router catch-all). JSON callers get a 404 instead of
// following a redirect to the HTML home page.
Route::fallback(fn (Request $request) => $request->expectsJson()
    ? response()->json(['message' => 'Not found.'], 404)
    : redirect('/'));

require __DIR__.'/auth.php';
