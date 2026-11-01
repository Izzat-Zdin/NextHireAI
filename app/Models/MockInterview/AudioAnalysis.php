<?php

namespace App\Models\MockInterview;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AudioAnalysis extends Model
{
    protected $table = 'audio_analyses';
    protected $primaryKey = 'audio_analysis_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'audio_analysis_id',
        'answer_id',
        'transcript',
        'word_count',
        'duration_seconds',
        'speaking_rate_wpm',
        'filler_total',
        'filler_rate_per_100_words',
        'silence_count',
        'silence_data',
        'measured',
    ];

    protected $casts = [
        'silence_data' => 'array',
        'measured' => 'boolean',
    ];

    public function answer(): BelongsTo
    {
        return $this->belongsTo(InterviewAnswer::class, 'answer_id', 'answer_id');
    }
}

