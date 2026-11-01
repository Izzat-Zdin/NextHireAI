<?php

namespace App\Models\MockInterview;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InterviewAnswer extends Model
{
    protected $table = 'interview_answers';
    protected $primaryKey = 'answer_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'answer_id',
        'session_id',
        'question_id',
        'answer_text',
        'answer_method',
        'audio_file_path',
        'duration_seconds',
        'is_selected_answer',
        'submitted_at',
    ];

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

