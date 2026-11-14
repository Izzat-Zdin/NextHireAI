<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** public.answer_attempts (project ERD). */
class AnswerAttempt extends Model
{
    use HasUuids;

    protected $table = 'answer_attempts';

    protected $primaryKey = 'attempt_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['attempt_no' => 'integer', 'attempted_at' => 'datetime'];
    }
}
