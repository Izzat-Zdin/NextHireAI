<?php

namespace App\Models\MockInterview;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Report extends Model
{
    protected $table = 'session_reports';
    protected $primaryKey = 'report_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'report_id',
        'session_id',
        'average_score',
        'answered_count',
        'question_count',
        'strengths_summary',
        'weaknesses_summary',
        'suggestions_summary',
        'report_summary',
        'pdf_path',
        'generated_at',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(InterviewSession::class, 'session_id', 'session_id');
    }
}

