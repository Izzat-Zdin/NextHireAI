<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/** public.interview_sessions: one mock interview. status Active | Pause | Cancel | Finish. */
class InterviewSession extends Model
{
    use HasUuids;

    protected $table = 'interview_sessions';

    protected $primaryKey = 'session_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(InterviewQuestion::class, 'session_id', 'session_id')->orderBy('question_no');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(InterviewAnswer::class, 'session_id', 'session_id')->orderBy('created_at')->orderBy('answer_id');
    }

    public function report(): HasOne
    {
        return $this->hasOne(Report::class, 'session_id', 'session_id');
    }

    public function summary(): HasOne
    {
        return $this->hasOne(InterviewSessionSummary::class, 'session_id', 'session_id');
    }
}
