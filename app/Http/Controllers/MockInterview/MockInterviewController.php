<?php

namespace App\Http\Controllers\MockInterview;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class MockInterviewController extends Controller
{
    public function index()
    {
        return Inertia::render('MockInterview/MockInterviewPage');
    }
}

