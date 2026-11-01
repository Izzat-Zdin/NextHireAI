<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MockInterview\MockInterviewController;
use App\Http\Controllers\MockInterview\InterviewSessionController;
use App\Http\Controllers\UserManagement\AuthController;
use App\Http\Controllers\UserManagement\ProfileController;
use App\Http\Controllers\ResumeAnalyzer\ResumeController;
use App\Http\Controllers\CareerReadiness\ReadinessAssessmentController;
use App\Http\Controllers\LearningRecommendation\LearningRecommendationController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminLearningResourceController;

Route::get('/', [MockInterviewController::class, 'index'])->name('dashboard');

// AI Mock Interview Engine
Route::prefix('interview')->group(function () {
    Route::get('/', [MockInterviewController::class, 'index'])->name('interview.index');
    Route::post('/session', [InterviewSessionController::class, 'create'])->name('interview.session.create');
    Route::post('/session/{sessionId}/answer', [InterviewSessionController::class, 'submitAnswer'])->name('interview.answer.submit');
    Route::post('/session/{sessionId}/complete', [InterviewSessionController::class, 'complete'])->name('interview.session.complete');
});

// ============================================================
// Module 1: User Management (Owner: Nada)
// ============================================================
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::prefix('profile')->group(function () {
    Route::get('/', [ProfileController::class, 'show'])->name('profile.show');
    Route::put('/', [ProfileController::class, 'update'])->name('profile.update');
});

// ============================================================
// Module 2: Resume Analyzer (Owner: Shafinaz)
// ============================================================
Route::prefix('resume')->group(function () {
    Route::get('/', [ResumeController::class, 'index'])->name('resume.index');
    Route::post('/upload', [ResumeController::class, 'upload'])->name('resume.upload');
    Route::post('/analyze', [ResumeController::class, 'analyze'])->name('resume.analyze');
    Route::get('/history', [ResumeController::class, 'history'])->name('resume.history');
    Route::get('/{id}', [ResumeController::class, 'show'])->name('resume.show');
});

// ============================================================
// Module 4: Career Readiness (Owner: Izzat)
// ============================================================
Route::prefix('career-readiness')->group(function () {
    Route::get('/', [ReadinessAssessmentController::class, 'index'])->name('career-readiness.index');
    Route::post('/', [ReadinessAssessmentController::class, 'store'])->name('career-readiness.store');
    Route::get('/result/{id}', [ReadinessAssessmentController::class, 'result'])->name('career-readiness.result');
});

// ============================================================
// Module 5: Learning Recommendation (Owner: Shafinaz & Wani)
// ============================================================
Route::prefix('learning')->group(function () {
    Route::get('/', [LearningRecommendationController::class, 'index'])->name('learning.index');
    Route::post('/recommend', [LearningRecommendationController::class, 'recommend'])->name('learning.recommend');
    Route::get('/{id}', [LearningRecommendationController::class, 'show'])->name('learning.show');
});

// ============================================================
// Module 6: Admin Panel
// ============================================================
Route::prefix('admin')->group(function () {
    // User Management
    Route::get('/users', [AdminUserController::class, 'index'])->name('admin.users.index');
    Route::get('/users/search', [AdminUserController::class, 'search'])->name('admin.users.search');
    Route::get('/users/{id}', [AdminUserController::class, 'show'])->name('admin.users.show');
    Route::post('/users/{id}/activate', [AdminUserController::class, 'activate'])->name('admin.users.activate');
    Route::post('/users/{id}/deactivate', [AdminUserController::class, 'deactivate'])->name('admin.users.deactivate');

    // Learning Resources Management
    Route::get('/learning-resources', [AdminLearningResourceController::class, 'index'])->name('admin.learning-resources.index');
    Route::post('/learning-resources', [AdminLearningResourceController::class, 'store'])->name('admin.learning-resources.store');
    Route::put('/learning-resources/{id}', [AdminLearningResourceController::class, 'update'])->name('admin.learning-resources.update');
    Route::delete('/learning-resources/{id}', [AdminLearningResourceController::class, 'destroy'])->name('admin.learning-resources.destroy');
});
