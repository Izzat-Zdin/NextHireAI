<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** public.reports (project ERD). */
class Report extends Model
{
    use HasUuids;

    protected $table = 'reports';

    protected $primaryKey = 'report_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['generated_at' => 'datetime'];
    }
}
