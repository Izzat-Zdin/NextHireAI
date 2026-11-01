<?php

namespace App\Models\MockInterview;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FollowUpQuestion extends Model
{
    protected $table = 'follow_up_questions';
    protected $primaryKey = 'follow_up_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'follow_up_id',
        'question_id',
        'answer_id',
        'follow_up_text',
        'generated_by',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(InterviewQuestion::class, 'question_id', 'question_id');
    }

    public function answer(): BelongsTo
    {
        return $this->belongsTo(InterviewAnswer::class, 'answer_id', 'answer_id');
    }
}

