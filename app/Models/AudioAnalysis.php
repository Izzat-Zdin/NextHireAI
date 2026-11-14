<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** public.audio_analyses (project ERD). */
class AudioAnalysis extends Model
{
    use HasUuids;

    protected $table = 'audio_analyses';

    protected $primaryKey = 'audio_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['word_count' => 'integer', 'speaking_rate' => 'float', 'filler_total' => 'integer', 'silence_count' => 'integer', 'created_at' => 'datetime'];
    }
}
