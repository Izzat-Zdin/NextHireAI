<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Postgres text[] <-> PHP array. The ERD stores skill tags / keywords as text[]
 * (e.g. learning_resources.skill_tags, resume.detected_skills).
 */
class PgTextArray implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        if ($value === null || $value === '' || $value === '{}') {
            return [];
        }
        if (is_array($value)) {
            return $value;
        }
        $inner = substr((string) $value, 1, -1);
        $out = [];
        $buffer = '';
        $inQuotes = false;
        $len = strlen($inner);
        for ($i = 0; $i < $len; $i++) {
            $char = $inner[$i];
            if ($inQuotes) {
                if ($char === '\\' && $i + 1 < $len) {
                    $buffer .= $inner[++$i];
                } elseif ($char === '"') {
                    $inQuotes = false;
                } else {
                    $buffer .= $char;
                }
            } elseif ($char === '"') {
                $inQuotes = true;
            } elseif ($char === ',') {
                $out[] = $buffer === 'NULL' ? null : $buffer;
                $buffer = '';
            } else {
                $buffer .= $char;
            }
        }
        if ($buffer !== '' || str_ends_with($inner, ',')) {
            $out[] = $buffer === 'NULL' ? null : $buffer;
        }

        return array_values(array_filter($out, fn ($item) => $item !== null));
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        $items = is_array($value) ? $value : [];
        $escaped = array_map(
            fn ($item) => '"'.str_replace(['\\', '"'], ['\\\\', '\\"'], (string) $item).'"',
            $items,
        );

        return '{'.implode(',', $escaped).'}';
    }
}
