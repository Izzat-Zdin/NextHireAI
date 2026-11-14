<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Read-only VIEW interview_session_summaries: a session row plus question_count,
 * answered_count, average_score (from answer_evaluations) and completed_at (reports.generated_at).
 */
class InterviewSessionSummary extends Model
{
    protected $table = 'interview_session_summaries';

    protected $primaryKey = 'session_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'question_count' => 'integer',
            'answered_count' => 'integer',
            'average_score' => 'float',
            'created_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }
}
