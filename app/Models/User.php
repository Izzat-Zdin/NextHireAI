<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\MockInterview\InterviewSession;
use App\Models\ResumeAnalyzer\Resume;
use App\Models\LearningRecommendation\LearningProgress;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'users';
    protected $primaryKey = 'user_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'full_name',
        'email',
        'password',
        'role',
        'status',
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

    public function interviewSessions(): HasMany
    {
        return $this->hasMany(InterviewSession::class, 'user_id', 'user_id');
    }

    /**
     * Get the resumes uploaded by this user.
     */
    public function resumes(): HasMany
    {
        return $this->hasMany(Resume::class, 'user_id', 'user_id');
    }

    /**
     * Get the learning progress records for this user.
     */
    public function learningProgress(): HasMany
    {
        return $this->hasMany(LearningProgress::class, 'user_id', 'user_id');
    }
}
