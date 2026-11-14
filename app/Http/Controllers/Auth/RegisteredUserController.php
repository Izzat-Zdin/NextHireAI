<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

/** Module 1: registration (email + password). Google sign-up lives in GoogleController. */
class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('user-management/pages/RegisterPage');
    }

    /**
     * Creates the users row (ERD: full_name, email, role 'user', status 'active') and signs in.
     * Returns JSON: { needsConfirmation } so the page can show "Check your inbox" when
     * email verification is switched on.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'full_name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::min(8)],
        ]);

        $requireVerification = (bool) config('nexthire.require_email_verification');

        $user = User::create([
            'full_name' => trim(preg_replace('/\s+/', ' ', $request->string('full_name'))),
            'email' => $request->string('email')->lower(),
            'password' => $request->string('password'),
            'role' => 'user',
            'status' => 'active',
            'email_verified_at' => $requireVerification ? null : now(),
        ]);

        event(new Registered($user));

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return response()->json(['needsConfirmation' => $requireVerification]);
    }
}
