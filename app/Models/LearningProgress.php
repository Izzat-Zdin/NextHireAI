<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * public.learning_progress (project ERD).
 *
 * Kelas ini juga dipakai oleh Admin UserController::activity (LearningProgress::where('user_id', ...)->pluck('status'))
 * dan User::learningProgress(). Jangan tukar nama kelas, $table atau $primaryKey.
 */
class LearningProgress extends Model
{
    use HasUuids;

    protected $table = 'learning_progress';

    protected $primaryKey = 'progress_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    // TODO (Shafinaz & Wani): benarkan mass assignment untuk updateOrCreate (asal: protected $guarded = [];
    //   atau $fillable = ['user_id', 'resource_id', 'status', 'progress_percent', 'completed_at']).

    // TODO (Shafinaz & Wani): casts:
    //   protected function casts(): array { return ['progress_percent' => 'integer', 'completed_at' => 'datetime']; }
}
