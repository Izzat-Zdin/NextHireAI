<?php

namespace App\Http\Controllers\MockInterview;

use App\Http\Controllers\Controller;
use App\Http\Requests\MockInterview\CreateSessionRequest;
use App\Http\Requests\MockInterview\SubmitAnswerRequest;
use App\Services\MockInterview\MockInterviewEvaluationService;

class InterviewSessionController extends Controller
{
    protected MockInterviewEvaluationService $evaluationService;

    public function __construct(MockInterviewEvaluationService $evaluationService)
    {
        $this->evaluationService = $evaluationService;
    }

    public function create(CreateSessionRequest $request)
    {
        // Placeholder for creating interview session
    }

    public function submitAnswer(SubmitAnswerRequest $request, string $sessionId)
    {
        // Placeholder for submitting an answer
    }

    public function complete(string $sessionId)
    {
        // Placeholder for finalizing interview session
    }
}

