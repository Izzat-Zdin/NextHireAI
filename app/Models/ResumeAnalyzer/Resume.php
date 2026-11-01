<?php

namespace App\Models\ResumeAnalyzer;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

/**
 * Resume Model
 *
 * Eloquent model for the resume table.
 * Owner: Shafinaz
 *
 * @property string $id
 * @property string $user_id
 * @property string $file_path
 * @property string $status
 */
class Resume extends Model
{
    use HasFactory;

    protected $table = 'resume';

    protected $fillable = [
        'user_id',
        'file_path',
        'status',
    ];

    /**
     * Get the user that owns the resume.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
