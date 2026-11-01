<?php

namespace App\Models\LearningRecommendation;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * LearningResource Model
 *
 * Eloquent model for learning resources.
 * Owner: Shafinaz & Wani
 *
 * @property string $id
 * @property string $title
 * @property string $description
 * @property string $category
 * @property string $url
 */
class LearningResource extends Model
{
    use HasFactory;

    protected $table = 'learning_resources';

    protected $fillable = [
        'title',
        'description',
        'category',
        'url',
        'skill_level',
    ];
}
