<?php

namespace App\Models;

use App\Casts\PgTextArray;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * public.resume: one resume analysis (ERD columns + approved analysis detail columns).
 *
 * NOTE (Shafinaz): model ini SUDAH SIAP — jangan ubah. Admin UserController::activity()
 * bergantung pada cast overall_score (float) dan analyzed_at (datetime ->toISOString()),
 * dan User::resumes() bergantung pada class ini. Kolum text[] guna App\Casts\PgTextArray.
 */
class Resume extends Model
{
    use HasUuids;

    protected $table = 'resume';

    protected $primaryKey = 'analysis_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'overall_score' => 'float',
            'file_size' => 'integer',
            'scores' => 'array',
            'sections' => 'array',
            'strengths' => 'array',
            'weaknesses' => 'array',
            'suggestions' => 'array',
            'detected_skills' => PgTextArray::class,
            'matched_keywords' => PgTextArray::class,
            'missing_keywords' => PgTextArray::class,
            'uploaded_at' => 'datetime',
            'analyzed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
