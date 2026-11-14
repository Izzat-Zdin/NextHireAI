<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * public.users (project ERD): user_id, full_name, email, status, role, created_at, updated_at
 * plus the auth columns added for Laravel: password, remember_token, email_verified_at,
 * google_id, avatar_url.
 */
class User extends Authenticatable implements MustVerifyEmail
{
    use HasUuids, Notifiable;

    protected $table = 'users';

    protected $primaryKey = 'user_id';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'full_name',
        'email',
        'password',
        'role',
        'status',
        'google_id',
        'avatar_url',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Email verification is optional (AUTH_REQUIRE_EMAIL_VERIFICATION). When it is off,
     * every account counts as verified, including rows created by the Supabase version.
     */
    public function hasVerifiedEmail(): bool
    {
        if (! config('nexthire.require_email_verification')) {
            return true;
        }

        return $this->email_verified_at !== null;
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin' && $this->status === 'active';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /** Laravel's default notifications/greetings use `name`; the ERD column is `full_name`. */
    public function getNameAttribute(): string
    {
        return $this->full_name ?? '';
    }

    public function resumes(): HasMany
    {
        return $this->hasMany(Resume::class, 'user_id', 'user_id');
    }

    public function interviewSessions(): HasMany
    {
        return $this->hasMany(InterviewSession::class, 'user_id', 'user_id');
    }

    public function learningProgress(): HasMany
    {
        return $this->hasMany(LearningProgress::class, 'user_id', 'user_id');
    }

    /** Shape sent to the browser (matches the UserProfile type of the React app). */
    public function toProfileArray(): array
    {
        return [
            'user_id' => $this->user_id,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'status' => $this->status,
            'role' => $this->role,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
            'avatar_url' => $this->avatar_url,
            'google_id' => $this->google_id,
        ];
    }
}
