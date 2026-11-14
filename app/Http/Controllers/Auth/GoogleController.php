<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

/**
 * Module 1: "Continue with Google" through Laravel Socialite.
 * Matches an existing users row by google_id or email (so accounts created in the
 * Supabase version keep their data), otherwise creates one.
 */
class GoogleController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')
            ->with(['prompt' => 'select_account'])
            ->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        try {
            $google = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            return redirect()->route('login')->with('authNotice', 'Sign-in could not be completed. Please try again.');
        }

        $email = Str::lower((string) $google->getEmail());
        if ($email === '') {
            return redirect()->route('login')->with('authNotice', 'Google did not return an email address for this account.');
        }

        $user = User::where('google_id', $google->getId())->first()
            ?? User::where('email', $email)->first();

        if ($user) {
            $user->forceFill([
                'google_id' => $user->google_id ?? $google->getId(),
                'avatar_url' => $google->getAvatar() ?: $user->avatar_url,
                'full_name' => $user->full_name !== '' ? $user->full_name : (string) $google->getName(),
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();
        } else {
            $user = User::create([
                'full_name' => (string) ($google->getName() ?: Str::before($email, '@')),
                'email' => $email,
                'password' => Str::random(40),
                'role' => 'user',
                'status' => 'active',
                'google_id' => $google->getId(),
                'avatar_url' => $google->getAvatar(),
                'email_verified_at' => now(),
            ]);
        }

        if (! $user->isActive()) {
            return redirect()->route('login')->with('authNotice', \App\Http\Middleware\EnsureUserIsActive::NOTICE);
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return redirect()->intended('/');
    }
}
