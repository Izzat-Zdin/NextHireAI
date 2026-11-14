<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** public.learning_resources: admin-curated catalogue (resource_type Course | Tutorial | Project | Cert | Article | Video | Practice). */
class LearningResource extends Model
{
    use HasUuids;

    protected $table = 'learning_resources';

    protected $primaryKey = 'resource_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    // TODO (Wani): benarkan mass assignment (asal: protected $guarded = [];
    //   atau senaraikan $fillable = ['title', 'resource_type', 'skill_name', 'resource_url', 'skill_tags']).

    // TODO (Wani): casts — skill_tags ialah text[] Postgres, mesti jadi array PHP/JSON:
    //   protected function casts(): array { return ['skill_tags' => \App\Casts\PgTextArray::class]; }

    // TODO (Wani): relation progress(): HasMany ke LearningProgress
    //   (foreign key 'resource_id', local key 'resource_id').
}
