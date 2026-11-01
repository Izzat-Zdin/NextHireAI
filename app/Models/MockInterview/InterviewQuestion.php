<?php

namespace App\Models\MockInterview;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InterviewQuestion extends Model
{
    protected $table = 'interview_questions';
    protected $primaryKey = 'question_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'question_id',
        'session_id',
        'question_no',
        'question_text',
        'question_type',
        'generated_by',
        'is_follow_up',
        'parent_question_id',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(InterviewSession::class, 'session_id', 'session_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(InterviewAnswer::class, 'question_id', 'question_id');
    }
}

