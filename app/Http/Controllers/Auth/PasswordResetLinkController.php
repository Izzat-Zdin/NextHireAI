<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Show the password reset link request page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('m1-user-management/pages/ForgotPasswordPage', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.  POST /forgot-password  body: { email }
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        // TODO (Nada): Hantar emel pautan reset kata laluan.
        //   1. Validate: 'email' => 'required|email'.
        //   2. Password::sendResetLink($request->only('email'));
        //      (import: use Illuminate\Support\Facades\Password;). Ini simpan token (hashed) dalam jadual
        //      password_reset_tokens (email, token, created_at) dan hantar emel dengan pautan /reset-password/{token}?email=...
        //   3. JANGAN beritahu sama ada emel wujud atau tidak (elak "user enumeration"). Abaikan status yang dipulangkan.
        //   4. return back()->with('status', __('A reset link will be sent if the account exists.'));
        return back()->withErrors(['email' => 'Belum dibina (TODO): fungsi lupa kata laluan belum siap.']);
    }
}
