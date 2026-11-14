<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** public.interview_questions: one question asked in a session (unique session_id + question_no). */
class InterviewQuestion extends Model
{
    use HasUuids;

    protected $table = 'interview_questions';

    protected $primaryKey = 'question_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['question_no' => 'integer', 'created_at' => 'datetime'];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(InterviewSession::class, 'session_id', 'session_id');
    }
}
