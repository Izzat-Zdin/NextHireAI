<?php

namespace App\Models\MockInterview;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacialAnalysis extends Model
{
    protected $table = 'facial_analyses';
    protected $primaryKey = 'facial_analysis_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'facial_analysis_id',
        'answer_id',
        'dominant_expression',
        'nervous_percent',
        'confidence_score',
        'eye_contact_score',
        'raw_metrics',
    ];

    protected $casts = [
        'raw_metrics' => 'array',
    ];

    public function answer(): BelongsTo
    {
        return $this->belongsTo(InterviewAnswer::class, 'answer_id', 'answer_id');
    }
}

