<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/** public.interview_answers: the candidate's answer to one question. answer_method Text | Audio | Video. */
class InterviewAnswer extends Model
{
    use HasUuids;

    protected $table = 'interview_answers';

    protected $primaryKey = 'answer_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(InterviewSession::class, 'session_id', 'session_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(InterviewQuestion::class, 'question_id', 'question_id');
    }

    public function evaluation(): HasOne
    {
        return $this->hasOne(AnswerEvaluation::class, 'answer_id', 'answer_id');
    }

    public function audioAnalysis(): HasOne
    {
        return $this->hasOne(AudioAnalysis::class, 'answer_id', 'answer_id');
    }

    public function facialAnalysis(): HasOne
    {
        return $this->hasOne(FacialAnalysis::class, 'answer_id', 'answer_id');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(AnswerAttempt::class, 'answer_id', 'answer_id');
    }
}
