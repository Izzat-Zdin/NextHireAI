<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** public.facial_analyses (project ERD). */
class FacialAnalysis extends Model
{
    use HasUuids;

    protected $table = 'facial_analyses';

    protected $primaryKey = 'facial_analysis_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['nervous_percent' => 'float', 'confidence_score' => 'float', 'eye_contact_score' => 'float', 'raw_metrics' => 'array', 'created_at' => 'datetime'];
    }
}
