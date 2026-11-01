<?php

namespace App\Models\MockInterview;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\User;

class InterviewSession extends Model
{
    protected $table = 'interview_sessions';
    protected $primaryKey = 'session_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'session_id',
        'user_id',
        'role',
        'interview_type',
        'language',
        'persona',
        'status',
        'current_question_no',
        'total_questions',
        'average_score',
        'completed_at',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(InterviewQuestion::class, 'session_id', 'session_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(InterviewAnswer::class, 'session_id', 'session_id');
    }

    public function report(): HasOne
    {
        return $this->hasOne(Report::class, 'session_id', 'session_id');
    }
}
