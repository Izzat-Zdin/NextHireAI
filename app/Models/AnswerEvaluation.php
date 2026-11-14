<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** public.answer_evaluations (project ERD). */
class AnswerEvaluation extends Model
{
    use HasUuids;

    protected $table = 'answer_evaluations';

    protected $primaryKey = 'evaluation_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['overall_score' => 'float', 'created_at' => 'datetime'];
    }
}
