<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    /**
     * Show the password reset page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('user-management/pages/ResetPasswordPage', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    /**
     * Handle an incoming new password request.  POST /reset-password  body: { token, email, password, password_confirmation }
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        // TODO (Nada): Tetapkan kata laluan baharu menggunakan token dari emel.
        //   1. Validate:
        //        'token'    => 'required',
        //        'email'    => 'required|email',
        //        'password' => ['required', 'confirmed', Rules\Password::min(8)]   (use Illuminate\Validation\Rules;)
        //   2. $status = Password::reset(
        //          $request->only('email', 'password', 'password_confirmation', 'token'),
        //          function ($user) use ($request) {
        //              $user->forceFill([
        //                  'password' => Hash::make($request->password),
        //                  'remember_token' => Str::random(60),
        //              ])->save();
        //              event(new PasswordReset($user));
        //          }
        //      );
        //      (imports: Illuminate\Support\Facades\Password, Illuminate\Support\Facades\Hash, Illuminate\Support\Str,
        //       Illuminate\Auth\Events\PasswordReset)
        //   3. Jika $status == Password::PasswordReset → return to_route('login')->with('status', __($status));
        //      (mesej: "Your password has been reset.")
        //   4. Jika gagal (token salah / tamat tempoh / emel tiada) →
        //      throw ValidationException::withMessages(['email' => [__($status)]]);   (use Illuminate\Validation\ValidationException;)
        //      cth mesej: "This password reset token is invalid."
        return back()->withErrors(['email' => 'Belum dibina (TODO): fungsi reset kata laluan belum siap.']);
    }
}
