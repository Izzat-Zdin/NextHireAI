<?php

namespace App\Models\MockInterview;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnswerEvaluation extends Model
{
    protected $table = 'answer_evaluations';
    protected $primaryKey = 'evaluation_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'evaluation_id',
        'answer_id',
        'relevance_score',
        'clarity_score',
        'specificity_score',
        'technical_accuracy_score',
        'overall_score',
        'strengths',
        'weaknesses',
        'improvements',
        'example_answer',
        'summary',
        'evaluation_source',
    ];

    public function answer(): BelongsTo
    {
        return $this->belongsTo(InterviewAnswer::class, 'answer_id', 'answer_id');
    }
}

