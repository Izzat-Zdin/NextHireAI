<?php

namespace App\Services\Interview;

/**
 * Server copy of resources/js/modules/m3-mock-interview/services/speechAnalysis.ts (filler matching).
 * Keep the word list and the exceptions identical to the browser version.
 */
class FillerDetector
{
    /** Hesitation sounds (um, uh, er ...) are matched by VOCAL_PATTERN in any length, so they are not listed here. */
    public const FILLER_WORDS = [
        'like', 'you know', 'i mean', 'sort of', 'kind of', 'basically', 'actually', 'you see', 'how to say', 'what to say',
        'so yeah', 'or something',
        'ha', 'haa', 'haah', 'kot', 'tahu tak', 'macam', 'apa tu', 'apa ni', 'apa benda', 'apa nama', 'tu lah',
        'maksud saya', 'apa orang kata', 'sebenarnya',
    ];

    /** um, umm, uhm, uh, er, erm, eh, em, ah, aa, eee, hmm, mm (same as VOCAL_FILLER_PATTERN in the browser). */
    private const VOCAL_PATTERN = 'u+h*m+|u+h+|e+r+m*|e+h+|e+m+|a+h+|a{2,}|e{3,}|h+m+|m{2,}';

    private const LIKE_NOT_FILLER = '/^\s+(a|an|the|this|that|these|those|my|your|his|her|our|their|its|to|of|in|on|at|for|with)\b/i';

    private const MACAM_NOT_FILLER = '/^(\s+(mana|ini|itu|tu|biasa|biasanya|sekarang|dulu|kita|saya)\b|-)/i';

    private const CLAUSE_START_FILLERS = ['actually', 'basically', 'sebenarnya'];

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

        if (preg_match_all('/(?<![\p{L}\p{N}\'])(?:'.self::VOCAL_PATTERN.')(?![\p{L}\p{N}\'])/iu', $text, $vocal, PREG_OFFSET_CAPTURE)) {
            foreach ($vocal[0] as [$match, $start]) {
                $end = $start + strlen($match);
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
                $name = self::vocalName($match);
                $counts[$name] = ($counts[$name] ?? 0) + 1;
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

    /** One name per hesitation sound, so "ummm" and "umm" both count as "um". */
    public static function vocalName(string $word): string
    {
        $w = mb_strtolower($word);

        return match (true) {
            (bool) preg_match('/^u+h*m+$/', $w) => 'um',
            (bool) preg_match('/^u+h+$/', $w) => 'uh',
            (bool) preg_match('/^e+r+m+$/', $w) => 'erm',
            (bool) preg_match('/^e+r+$/', $w) => 'er',
            (bool) preg_match('/^e+h+$/', $w) => 'eh',
            (bool) preg_match('/^e+m+$/', $w) => 'em',
            (bool) preg_match('/^a+h+$/', $w) => 'ah',
            (bool) preg_match('/^a+$/', $w) => 'aa',
            (bool) preg_match('/^e+$/', $w) => 'ee',
            (bool) preg_match('/^h+m+$/', $w) => 'hmm',
            default => 'mm',
        };
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
