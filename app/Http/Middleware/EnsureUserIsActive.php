<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Deactivated accounts (users.status = 'inactive') are signed out with the same
 * notice the original app showed on the login page.
 */
class EnsureUserIsActive
{
    public const NOTICE = 'Your account has been deactivated by an administrator. Please contact support.';

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user && ! $user->isActive()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return response()->json(['message' => self::NOTICE], 401);
            }

            return redirect()->route('login')->with('authNotice', self::NOTICE);
        }

        return $next($request);
    }
}
