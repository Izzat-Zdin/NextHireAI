<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/** Module 1: email + password login, dev-only test-account login, logout. */
class AuthenticatedSessionController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('user-management/pages/LoginPage', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        return redirect()->intended('/');
    }

    /** "Continue as Ali Test" / "Continue as Admin Test": credentials come from the server .env. */
    public function storeTestAccount(Request $request): RedirectResponse
    {
        $request->validate(['account' => ['required', 'in:user,admin']]);

        abort_unless(config('nexthire.test_accounts_enabled'), 404);

        $account = config('nexthire.test_accounts.'.$request->string('account'));
        if (empty($account['email']) || empty($account['password'])) {
            throw ValidationException::withMessages(['account' => "The {$account['name']} account is not configured in .env."]);
        }

        // Dev convenience: make sure the test account exists with the .env password
        // (rows created by the Supabase version have no password column value).
        $user = User::firstOrNew(['email' => $account['email']]);
        if (! $user->exists || ! $user->password || ! Hash::check($account['password'], $user->password)) {
            $user->fill([
                'full_name' => $user->full_name ?: $account['name'],
                'password' => Hash::make($account['password']),
                'role' => $request->string('account') === 'admin' ? 'admin' : ($user->role ?: 'user'),
                'status' => 'active',
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();
        }

        if (! Auth::attempt(['email' => $account['email'], 'password' => $account['password']], true)) {
            throw ValidationException::withMessages([
                'account' => "Could not sign in as {$account['name']}. Check TEST_* in .env.",
            ]);
        }

        $request->session()->regenerate();

        return redirect()->intended('/');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
