<?php

namespace App\Models\LearningRecommendation;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

/**
 * LearningProgress Model
 *
 * Eloquent model for tracking learning progress.
 * Owner: Shafinaz & Wani
 *
 * @property string $id
 * @property string $user_id
 * @property string $learning_resource_id
 * @property string $status
 * @property int $progress_percentage
 */
class LearningProgress extends Model
{
    use HasFactory;

    protected $table = 'learning_progress';

    protected $fillable = [
        'user_id',
        'learning_resource_id',
        'status',
        'progress_percentage',
    ];

    /**
     * Get the user that owns this learning progress.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    /**
     * Get the learning resource associated with this progress.
     */
    public function learningResource(): BelongsTo
    {
        return $this->belongsTo(LearningResource::class);
    }
}
