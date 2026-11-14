<?php

namespace App\Http\Middleware;

use App\Models\InterviewSession;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /** The root template that's loaded on the first page visit. */
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Props shared with every page: the signed-in user (UserProfile shape), the route
     * parameters (for the React Router `useParams` shim), the paused-session count for the
     * nav dot, the login notice, and the dev-only test accounts (names/emails only).
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user?->toProfileArray(),
            ],
            'params' => $this->routeParams($request),
            // Closure: only evaluated for Inertia page responses, never for the JSON API calls
            // (which go through the same middleware), so each API call saves a DB round trip.
            'pausedSessionCount' => fn () => $user
                ? InterviewSession::where('user_id', $user->user_id)->where('status', 'Pause')->count()
                : 0,
            'authNotice' => fn () => $request->session()->get('authNotice'),
            'flash' => fn () => [
                'status' => $request->session()->get('status'),
            ],
            'testAccounts' => $this->testAccounts(),
            'features' => [
                'fillerTranscription' => filled(config('services.deepgram.key')),
            ],
        ];
    }

    /** Always a JSON object (never []), so `useParams()` in the browser gets `{}` when there are none. */
    private function routeParams(Request $request): object
    {
        $route = $request->route();
        $out = [];
        if ($route) {
            foreach ($route->parameters() as $key => $value) {
                $out[$key] = $value instanceof Model ? (string) $value->getRouteKey() : (string) $value;
            }
        }

        return (object) $out;
    }

    /** @return list<array{id: string, name: string, email: string}> */
    private function testAccounts(): array
    {
        if (! config('nexthire.test_accounts_enabled')) {
            return [];
        }
        $out = [];
        foreach (config('nexthire.test_accounts') as $id => $account) {
            if (! empty($account['email']) && ! empty($account['password'])) {
                $out[] = ['id' => $id, 'name' => $account['name'], 'email' => $account['email']];
            }
        }

        return $out;
    }
}
