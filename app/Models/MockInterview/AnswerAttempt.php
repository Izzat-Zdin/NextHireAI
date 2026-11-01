<?php

namespace App\Models\MockInterview;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnswerAttempt extends Model
{
    protected $table = 'answer_attempts';
    protected $primaryKey = 'attempt_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'attempt_id',
        'question_id',
        'answer_id',
        'attempt_no',
        'previous_score',
        'new_score',
        'score_difference',
        'is_best_attempt',
        'attempted_at',
    ];

    public function answer(): BelongsTo
    {
        return $this->belongsTo(InterviewAnswer::class, 'answer_id', 'answer_id');
    }
}

