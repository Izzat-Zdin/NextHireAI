<?php

namespace App\Services\Interview;

/**
 * Server copy of resources/js/modules/mock-interview/services/speechAnalysis.ts (filler matching).
 * Keep the word list and the exceptions identical to the browser version.
 */
class FillerDetector
{
    public const FILLER_WORDS = [
        'um', 'umm', 'ummm', 'uh', 'uhh', 'uhhh', 'ah', 'ahh', 'ahhh', 'aah', 'er', 'err', 'errr', 'erm', 'ermm',
        'hmm', 'hmmm', 'aaa', 'eee', 'like', 'you know', 'i mean', 'sort of', 'kind of', 'basically', 'actually',
        'ha', 'haa', 'haah', 'mmm', 'kot', 'tahu tak', 'macam', 'apa tu', 'apa ni', 'apa benda', 'apa nama', 'tu lah',
    ];

    private const LIKE_NOT_FILLER = '/^\s+(a|an|the|this|that|these|those|my|your|his|her|our|their|its|to|of|in|on|at|for|with)\b/i';

    private const MACAM_NOT_FILLER = '/^(\s+(mana|ini|itu|tu|biasa|biasanya|sekarang|dulu|kita|saya)\b|-)/i';

    private const CLAUSE_START_FILLERS = ['actually', 'basically'];

    /** @return array{total:int, perWord:array<string,int>, ratePer100Words:float} */
    public static function detect(string $text): array
    {
        if (trim($text) === '') {
            return ['total' => 0, 'perWord' => [], 'ratePer100Words' => 0.0];
        }

        $words = self::sortedFillers();
        $taken = [];
        $counts = [];
        $total = 0;

        foreach ($words as $phrase) {
            $pattern = implode('\s+', array_map(fn ($p) => preg_quote($p, '/'), preg_split('/\s+/', $phrase)));
            $regex = '/(?<![\p{L}\p{N}\'])'.$pattern.'(?![\p{L}\p{N}\'])/iu';
            if (! preg_match_all($regex, $text, $matches, PREG_OFFSET_CAPTURE)) {
                continue;
            }
            $occurrences = count($matches[0]);
            foreach ($matches[0] as [$match, $start]) {
                $end = $start + strlen($match);
                $after = substr($text, $end);
                if ($phrase === 'like' && preg_match(self::LIKE_NOT_FILLER, $after)) {
                    continue;
                }
                if ($phrase === 'macam' && (preg_match(self::MACAM_NOT_FILLER, $after) || ($start > 0 && $text[$start - 1] === '-'))) {
                    continue;
                }
                if (in_array($phrase, self::CLAUSE_START_FILLERS, true) && ! self::isClauseStart($text, $start) && $occurrences < 2) {
                    continue;
                }
                $overlaps = false;
                for ($i = $start; $i < $end; $i++) {
                    if (isset($taken[$i])) {
                        $overlaps = true;
                        break;
                    }
                }
                if ($overlaps) {
                    continue;
                }
                for ($i = $start; $i < $end; $i++) {
                    $taken[$i] = true;
                }
                $counts[$phrase] = ($counts[$phrase] ?? 0) + 1;
                $total++;
            }
        }

        $wordCount = self::countWords($text);

        return [
            'total' => $total,
            'perWord' => $counts,
            'ratePer100Words' => $wordCount > 0 ? round($total / $wordCount * 100, 1) : 0.0,
        ];
    }

    public static function countWords(string $text): int
    {
        $text = trim($text);

        return $text === '' ? 0 : count(preg_split('/\s+/u', $text));
    }

    private static function isClauseStart(string $text, int $start): bool
    {
        $before = rtrim(substr($text, 0, $start));

        return $before === '' || preg_match('/[.!?,;:]$/', $before) === 1;
    }

    /** Longest phrases first so "you know" wins over shorter overlaps (stable, like Array.sort in the browser). */
    private static function sortedFillers(): array
    {
        $words = self::FILLER_WORDS;
        $indexed = array_map(null, $words, array_keys($words));
        usort($indexed, fn ($a, $b) => (strlen($b[0]) <=> strlen($a[0])) ?: ($a[1] <=> $b[1]));

        return array_column($indexed, 0);
    }
}
