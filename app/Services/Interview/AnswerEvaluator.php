<?php

namespace App\Services\Interview;

/**
 * Server copy of resources/js/modules/mock-interview/services/evaluation.ts.
 *
 * The browser shows the score instantly; this class recomputes it from the stored answer text, so a
 * score posted from the browser (or forged with DevTools) is never saved. Keep both files in step:
 * any change to a word list, weight or cap there must be made here too (tests/Unit/AnswerEvaluatorTest.php).
 */
class AnswerEvaluator
{
    public const STOPWORDS = [
        'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'them', 'their',
        'a', 'an', 'the', 'and', 'or', 'but', 'so', 'because', 'if', 'then', 'than', 'that', 'this', 'these', 'those',
        'is', 'am', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'did', 'does', 'will', 'would', 'can', 'could',
        'to', 'of', 'in', 'on', 'at', 'for', 'with', 'from', 'by', 'about', 'as', 'into', 'after', 'before', 'when', 'while', 'what', 'how', 'which', 'who',
        'not', 'no', 'very', 'also', 'just', 'more', 'most', 'some', 'all', 'each',
        'saya', 'kami', 'kita', 'anda', 'dia', 'mereka', 'dan', 'atau', 'tetapi', 'kerana', 'sebab', 'jika', 'kalau', 'maka',
        'yang', 'ini', 'itu', 'di', 'ke', 'dari', 'daripada', 'pada', 'untuk', 'dengan', 'dalam', 'oleh', 'tentang', 'sebagai',
        'ada', 'adalah', 'ialah', 'akan', 'telah', 'sudah', 'sedang', 'boleh', 'perlu', 'tidak', 'bukan', 'juga', 'lebih', 'sangat', 'semasa', 'ketika', 'apabila', 'selepas', 'sebelum',
    ];

    private const EXAMPLE_CUE = '/\b(for example|for instance|such as|like when|instance|project|team|company|client|customer|internship|projek|pasukan|syarikat|pelanggan|contohnya|misalnya|sebagai contoh)\b/i';

    private const NUMBER_CUE = '/\d+(?:[.,]\d+)?\s*(?:%|k|m|rm|percent|peratus)?|\b(one|two|three|four|five|six|seven|eight|nine|ten|first|second|third|satu|dua|tiga|empat|lima|pertama|kedua|ketiga)\b/i';

    private const STAR_CUE = '/\b(situation|task|action|result|challenge|goal|outcome|achieved|improved|reduced|increased|keadaan|tugas|tindakan|hasil|hasilnya|cabaran|matlamat|mencapai|meningkat|berjaya)\b/i';

    private const GENERAL_TERMS = [
        'deadline', 'stakeholder', 'priority', 'prioritise', 'prioritize', 'feedback', 'process', 'plan', 'schedule', 'budget', 'report',
        'kpi', 'target', 'metric', 'metrics', 'quality', 'customer', 'client', 'collaborate', 'communication', 'problem',
        'tarikh akhir', 'keutamaan', 'maklum balas', 'proses', 'perancangan', 'jadual', 'bajet', 'laporan', 'sasaran', 'kualiti', 'pelanggan', 'kerjasama', 'komunikasi', 'masalah',
    ];

    private const ROLE_TERMS = [
        [
            '/\b(software|developer|engineer|programmer|web|frontend|front-end|backend|back-end|full ?stack|devops|it\b|system|network|mobile|app|cloud|security|pembangun|perisian|sistem|rangkaian)\b/i',
            ['api', 'database', 'framework', 'algorithm', 'component', 'architecture', 'deploy', 'deployment', 'test', 'testing', 'unit test', 'function', 'class', 'module', 'schema', 'query', 'sql', 'server', 'json', 'rest', 'git', 'ci/cd', 'bug', 'debug', 'refactor', 'latency', 'cache', 'docker', 'cloud', 'react', 'laravel', 'python', 'java', 'pangkalan data', 'pelayan', 'pengekodan', 'ujian'],
        ],
        [
            '/\b(data|analyst|analytics|scientist|machine learning|ml|ai|business intelligence|bi|penganalisis|analisis data)\b/i',
            ['sql', 'python', 'dashboard', 'regression', 'model', 'dataset', 'visualisation', 'visualization', 'excel', 'power bi', 'tableau', 'statistics', 'correlation', 'a/b', 'forecast', 'cleaning', 'pipeline', 'data', 'statistik', 'ramalan', 'papan pemuka'],
        ],
        [
            '/\b(marketing|sales|business|growth|brand|social media|content|digital|seo|pemasaran|jualan|perniagaan|jenama)\b/i',
            ['cac', 'ltv', 'churn', 'retention', 'conversion', 'funnel', 'campaign', 'roi', 'engagement', 'lead', 'leads', 'seo', 'brand', 'segment', 'a/b', 'revenue', 'pipeline', 'quota', 'kempen', 'jualan', 'hasil', 'penukaran', 'pelanggan sasaran'],
        ],
        [
            '/\b(account|accountant|accounting|finance|financial|audit|auditor|tax|bank|perakaunan|akauntan|kewangan|juruaudit|cukai)\b/i',
            ['reconciliation', 'ledger', 'balance sheet', 'cash flow', 'audit', 'tax', 'accrual', 'budget', 'variance', 'forecast', 'invoice', 'ifrs', 'mfrs', 'payroll', 'compliance', 'penyata', 'aliran tunai', 'lejar', 'cukai', 'audit', 'belanjawan', 'pematuhan'],
        ],
        [
            '/\b(nurse|nursing|doctor|medical|clinic|hospital|health|pharmac|therapist|jururawat|doktor|perubatan|klinik|hospital|kesihatan|farmasi)\b/i',
            ['patient', 'care plan', 'triage', 'medication', 'vital signs', 'infection control', 'hygiene', 'ward', 'handover', 'assessment', 'safety', 'sop', 'pesakit', 'rawatan', 'ubat', 'wad', 'kebersihan', 'keselamatan', 'penilaian'],
        ],
        [
            '/\b(teacher|lecturer|tutor|education|teaching|trainer|cikgu|guru|pensyarah|pendidikan|pengajar|jurulatih)\b/i',
            ['lesson plan', 'curriculum', 'assessment', 'classroom', 'student', 'learning outcome', 'differentiated', 'rubric', 'engagement', 'pedagogy', 'rancangan pengajaran', 'kurikulum', 'pentaksiran', 'bilik darjah', 'murid', 'pelajar', 'hasil pembelajaran'],
        ],
        [
            '/\b(mechanical|civil|electrical|chemical|manufacturing|production|quality|maintenance|technician|site|kejuruteraan|juruteknik|pembuatan|pengeluaran|penyelenggaraan|tapak)\b/i',
            ['autocad', 'solidworks', 'maintenance', 'root cause', 'lean', 'six sigma', 'safety', 'osha', 'iso', 'inspection', 'tolerance', 'commissioning', 'plc', 'drawing', 'specification', 'punca', 'keselamatan', 'pemeriksaan', 'lukisan', 'spesifikasi', 'penyelenggaraan'],
        ],
        [
            '/\b(design|designer|ui|ux|graphic|creative|pereka|reka bentuk|grafik)\b/i',
            ['wireframe', 'prototype', 'figma', 'user research', 'usability', 'persona', 'accessibility', 'typography', 'layout', 'brand guideline', 'iteration', 'prototaip', 'kebolehgunaan', 'susun atur', 'penyelidikan pengguna'],
        ],
        [
            '/\b(hr|human resource|recruit|talent|admin|administrative|executive|clerk|officer|sumber manusia|pengambilan|pentadbiran|eksekutif|kerani|pegawai)\b/i',
            ['recruitment', 'onboarding', 'policy', 'payroll', 'compliance', 'employee', 'interview', 'record', 'filing', 'documentation', 'sop', 'pengambilan', 'dasar', 'pekerja', 'rekod', 'dokumentasi', 'pematuhan'],
        ],
        [
            '/\b(customer service|support|call centre|call center|hospitality|hotel|restaurant|retail|cashier|front desk|khidmat pelanggan|sokongan|hotel|restoran|runcit|juruwang)\b/i',
            ['complaint', 'escalation', 'service level', 'satisfaction', 'ticket', 'resolution', 'upsell', 'inventory', 'pos', 'check-in', 'aduan', 'kepuasan', 'penyelesaian', 'inventori', 'perkhidmatan'],
        ],
    ];

    private const FALLBACK_TERMS = ['api', 'database', 'framework', 'algorithm', 'system', 'process', 'analytics', 'metrics', 'kpi', 'testing', 'sprint', 'scrum', 'sistem', 'proses', 'analisis'];

    private const STAR_PRESENT = [
        'situation' => '/\b(when i was|while i was|at my|in my (last|previous|current)|during my|at (a|an|the) (company|startup|firm|bank|agency)|internship|semester|project|our team|the team|we had|there was|situation|background|keadaan|semasa saya|ketika saya|di syarikat|projek|latihan industri|pasukan kami)\b/i',
        'task' => '/\b(my (role|job|task|goal|responsibility)|i was (asked|responsible|tasked|in charge)|i needed to|we needed to|the goal was|had to|objective|target|tugas saya|peranan saya|saya perlu|matlamat|bertanggungjawab|sasaran)\b/i',
        'action' => '/\b(i (built|created|designed|wrote|led|ran|set up|organised|organized|analysed|analyzed|pulled|proposed|decided|talked|spoke|worked|implemented|changed|tested|trained|introduced|reached out|started|used|made)|i then|so i|first,? i|next,? i|saya (bina|buat|reka|tulis|pimpin|cadangkan|analisis|laksanakan|ubah|uji|latih|mula|guna|hubungi)|lalu saya|kemudian saya)\b/i',
        'result' => '/\b(as a result|resulted in|result was|in the end|which (led|meant)|this (led|meant|cut|reduced|increased|improved|saved)|reduced|increased|improved|saved|grew|dropped|cut|achieved|delivered|launched|finished|outcome|impact|hasilnya|akhirnya|berjaya|meningkat|menurun|berkurang|menjimatkan|dicapai)\b/i',
    ];

    private const STAR_ORDER = [
        'situation' => '/\b(when i was|while i was|in my (last|previous|current)|during my|internship|our team|we had|there was|semasa saya|ketika saya|di syarikat|latihan industri|pasukan kami)\b/i',
        'task' => '/\b(my (role|job|task|goal|responsibility)|i was (asked|responsible|tasked|in charge)|i needed to|we needed to|the goal was|tugas saya|peranan saya|saya perlu|matlamat)\b/i',
        'action' => '/\b(i (built|created|designed|wrote|led|organised|organized|analysed|analyzed|proposed|decided|implemented|changed|tested|trained|introduced|started)|so i|first,? i|saya (bina|buat|reka|tulis|pimpin|cadangkan|analisis|laksanakan|ubah|uji|latih|mula)|lalu saya|kemudian saya)\b/i',
        'result' => '/\b(as a result|resulted in|in the end|which (led|meant)|reduced|increased|improved|saved|achieved|outcome|hasilnya|akhirnya|berjaya|meningkat|menurun|dicapai)\b/i',
    ];

    public const CAP_SHORT_PER_WORD = 3;

    public const CAP_MIN_WORDS = 8;

    public const CAP_NO_SENTENCES = 20;

    public const CAP_STUFFING = 45;

    public const CAP_REPETITIVE = 30;

    /**
     * @param  string  $type  hr | behavioral | technical
     * @param  int|null  $clientFillers  filler count measured in the browser (can include "um"/"uh" from a filler-aware
     *                                   transcriber); only ever raises the count, so it can only lower the score
     * @param  float|null  $wpm  words per minute of a spoken answer (only used for the "hurried" comment)
     * @return array{scores: array<string,int>, overallScore: int, strengths: string[], weaknesses: string[], improvements: string[], fillerTotal: int}
     */
    public static function evaluate(string $question, string $answer, string $type, string $role, bool $isMalay, ?int $clientFillers = null, ?float $wpm = null): array
    {
        $t = $isMalay ? self::ms() : self::en();
        $clean = trim($answer);

        if ($clean === '') {
            return [
                'scores' => ['relevance' => 0, 'clarity' => 0, 'specificity' => 0, 'technicalAccuracy' => 0],
                'overallScore' => 0,
                'strengths' => [],
                'weaknesses' => [$isMalay ? 'Tiada jawapan diberikan.' : 'No answer was provided.'],
                'improvements' => [$isMalay
                    ? 'Sila berikan jawapan lisan atau bertulis supaya AI dapat menganalisis prestasi anda.'
                    : 'Provide a response so we can analyze your interview content and delivery.'],
                'fillerTotal' => 0,
            ];
        }

        $normalized = mb_strtolower($clean);
        $words = preg_split('/\s+/u', $normalized, -1, PREG_SPLIT_NO_EMPTY);
        $tokens = array_values(array_filter(array_map(
            fn ($w) => preg_replace('/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/u', '', $w),
            $words,
        ), fn ($w) => $w !== ''));
        $wordCount = count($tokens);
        $sentences = array_values(array_filter(preg_split('/[.!?]+/', $normalized), fn ($s) => trim($s) !== ''));

        $stop = array_flip(self::STOPWORDS);
        $stopwordCount = count(array_filter($tokens, fn ($w) => isset($stop[$w])));
        $stopRatio = $wordCount ? $stopwordCount / $wordCount : 0;
        $uniqueRatio = $wordCount ? count(array_unique($tokens)) / $wordCount : 0;
        $tooShort = $wordCount < self::CAP_MIN_WORDS;
        $noSentences = ! $tooShort && $stopRatio < 0.08;
        $repetitive = $wordCount >= 20 && $uniqueRatio < 0.35;

        [$techDistinct, $techTotal] = self::termHits($normalized, self::termsForRole($role));
        $exampleHits = preg_match_all(self::EXAMPLE_CUE, $normalized);
        $numberHits = preg_match_all(self::NUMBER_CUE, $normalized);
        $starHits = preg_match_all(self::STAR_CUE, $normalized);
        $density = $wordCount ? ($techTotal + $exampleHits + $starHits) / $wordCount : 0;
        $stuffing = ! $tooShort && $density > 0.3;

        // 1. Relevance
        $questionWords = array_unique(array_filter(
            preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower($question)),
            fn ($w) => mb_strlen($w) > 3 && ! isset($stop[$w]),
        ));
        $answerWords = array_flip(array_filter($tokens, fn ($w) => mb_strlen($w) > 3));
        $overlap = count(array_filter($questionWords, fn ($w) => isset($answerWords[$w])));
        $relevance = 3 + self::round($overlap / max(1, count($questionWords)) * 7);
        if ($wordCount > 25) {
            $relevance++;
        }
        $relevance = self::clamp($relevance, 1, 10);

        // 2. Clarity
        $fillers = FillerDetector::detect($clean);
        $fillerTotal = max($fillers['total'], min((int) ($clientFillers ?? 0), $wordCount));
        $fillerRate = $fillerTotal === $fillers['total']
            ? $fillers['ratePer100Words']
            : ($wordCount > 0 ? round($fillerTotal / FillerDetector::countWords($clean) * 100, 1) : 0);
        $avgSentence = $wordCount / max(1, count($sentences));
        $clarity = 5;
        if ($avgSentence >= 6 && $avgSentence <= 24) {
            $clarity += 2;
        }
        if (count($sentences) >= 2) {
            $clarity++;
        }
        if ($wordCount >= 30) {
            $clarity++;
        }
        if ($fillerRate > 6) {
            $clarity -= 2;
        } elseif ($fillerRate > 3) {
            $clarity--;
        }
        $clarity = self::clamp($clarity, 1, 10);

        // 3. Specificity & STAR
        $starParts = count(array_filter(self::STAR_PRESENT, fn ($re) => preg_match($re, $clean) === 1));
        $specificity = 4;
        if ($exampleHits > 0) {
            $specificity += 2;
        }
        if ($numberHits > 0) {
            $specificity += 2;
        }
        if ($starParts >= 2) {
            $specificity++;
        }
        if ($starParts >= 2 && self::starInOrder($clean)) {
            $specificity++;
        }
        if ($wordCount > 50) {
            $specificity++;
        }
        if ($stuffing) {
            $specificity = min($specificity, 4);
        }
        $specificity = self::clamp($specificity, 1, 10);

        // 4. Technical accuracy
        $technical = $type === 'technical' ? 4 : 5;
        if ($techDistinct >= 1) {
            $technical += 2;
        }
        if ($techDistinct >= 3) {
            $technical++;
        }
        if ($wordCount > 40) {
            $technical++;
        }
        if ($stuffing) {
            $technical = min($technical, 4);
        }
        $technical = self::clamp($technical, 1, 10);

        $overall = self::round(($relevance + $clarity + $specificity + $technical) * 2.5);
        if ($tooShort) {
            $overall = min($overall, $wordCount * self::CAP_SHORT_PER_WORD);
        }
        if ($noSentences) {
            $overall = min($overall, self::CAP_NO_SENTENCES);
        }
        if ($stuffing) {
            $overall = min($overall, self::CAP_STUFFING);
        }
        if ($repetitive) {
            $overall = min($overall, self::CAP_REPETITIVE);
        }
        $overall = self::clamp($overall, 0, 100);

        $strengths = [];
        if (! $tooShort && ! $noSentences && ! $stuffing) {
            if ($relevance >= 7) {
                $strengths[] = $t['strongRelevance'];
            }
            if ($clarity >= 7) {
                $strengths[] = $t['strongClarity'];
            }
            if ($specificity >= 7) {
                $strengths[] = $t['strongSpecificity'];
            }
            if ($technical >= 7) {
                $strengths[] = $t['strongTechnical'];
            }
        }
        if (! $strengths) {
            $strengths[] = $tooShort || $noSentences ? $t['strongTried'] : $t['strongBase'];
        }

        $weaknesses = [];
        if ($tooShort) {
            $weaknesses[] = $t['weakTooShort'];
        } elseif ($noSentences) {
            $weaknesses[] = $t['weakNoSentences'];
        }
        if ($stuffing) {
            $weaknesses[] = $t['weakStuffing'];
        }
        if ($repetitive) {
            $weaknesses[] = $t['weakRepetitive'];
        }
        if (! $tooShort && $wordCount < 35) {
            $weaknesses[] = $t['weakBrief'];
        }
        if ($specificity < 6) {
            $weaknesses[] = $t['weakSpecificity'];
        }
        if ($fillerRate > 5) {
            $weaknesses[] = sprintf($t['weakFillers'], $fillerTotal);
        }
        if ($wpm && $wpm > 175) {
            $weaknesses[] = sprintf($t['weakFast'], (int) round($wpm));
        }

        $improvements = [$t['improveStar']];
        if ($specificity < 7) {
            $improvements[] = $t['improveNumber'];
        }
        if ($fillerRate > 4) {
            $improvements[] = $t['improveFillers'];
        }
        if (count($improvements) < 3) {
            $improvements[] = $t['improveClose'];
        }

        return [
            'scores' => ['relevance' => $relevance, 'clarity' => $clarity, 'specificity' => $specificity, 'technicalAccuracy' => $technical],
            'overallScore' => $overall,
            'strengths' => array_slice($strengths, 0, 3),
            'weaknesses' => array_slice($weaknesses, 0, 3),
            'improvements' => array_slice($improvements, 0, 3),
            'fillerTotal' => $fillerTotal,
        ];
    }

    /** @return string[] */
    public static function termsForRole(string $role): array
    {
        $domain = [];
        foreach (self::ROLE_TERMS as [$pattern, $terms]) {
            if (preg_match($pattern, $role)) {
                array_push($domain, ...$terms);
            }
        }
        if (! $domain) {
            $domain = self::FALLBACK_TERMS;
        }

        return array_values(array_unique([...$domain, ...self::GENERAL_TERMS]));
    }

    /** @return array{0:int,1:int} distinct terms found, total occurrences */
    private static function termHits(string $text, array $terms): array
    {
        $distinct = 0;
        $total = 0;
        foreach ($terms as $term) {
            $n = preg_match_all('/(?<![\p{L}\p{N}])'.preg_quote($term, '/').'(?![\p{L}\p{N}])/iu', $text);
            if ($n) {
                $distinct++;
                $total += $n;
            }
        }

        return [$distinct, $total];
    }

    private static function starInOrder(string $answer): bool
    {
        $at = function (string $re) use ($answer): int {
            return preg_match($re, $answer, $m, PREG_OFFSET_CAPTURE) ? $m[0][1] : -1;
        };
        $setupCandidates = array_filter([$at(self::STAR_ORDER['situation']), $at(self::STAR_ORDER['task'])], fn ($i) => $i >= 0);
        $setup = $setupCandidates ? min($setupCandidates) : -1;
        $points = array_values(array_filter([$setup, $at(self::STAR_ORDER['action']), $at(self::STAR_ORDER['result'])], fn ($i) => $i >= 0));
        if (count($points) < 2) {
            return false;
        }
        for ($i = 1; $i < count($points); $i++) {
            if ($points[$i] <= $points[$i - 1]) {
                return false;
            }
        }

        return true;
    }

    /** Math.round in JavaScript: halves go up. */
    private static function round(float $n): int
    {
        return (int) floor($n + 0.5);
    }

    private static function clamp(int $n, int $min, int $max): int
    {
        return min($max, max($min, $n));
    }

    private static function en(): array
    {
        return [
            'strongRelevance' => 'Your answer directly addresses the core objective of the question.',
            'strongClarity' => 'Well-structured phrasing with clear transitions between key points.',
            'strongSpecificity' => 'You backed your points with tangible actions and measurable outcomes.',
            'strongTechnical' => 'Effective use of terminology from your field.',
            'strongBase' => 'Good effort; the foundational concept of your answer is clear.',
            'strongTried' => 'You made an attempt; now build it into full sentences.',
            'weakTooShort' => 'The answer is too short to assess. Answer in full sentences.',
            'weakNoSentences' => 'This does not read as a sentence-based answer. Explain in your own words rather than listing words.',
            'weakStuffing' => 'The answer reads like a list of keywords. Explain what you did and why it mattered.',
            'weakRepetitive' => 'The same words are repeated many times. Add new detail instead.',
            'weakBrief' => 'The answer is relatively brief; interviewers expect deeper context.',
            'weakSpecificity' => 'Lacks concrete metrics, KPIs, or quantitative evidence of impact.',
            'weakFillers' => 'High filler word frequency (%d fillers detected).',
            'weakFast' => 'Speaking pace was hurried (%d WPM).',
            'improveStar' => 'Structure your thoughts using the STAR method: Situation → Task → Action → Result.',
            'improveNumber' => "Include at least one measurable KPI (e.g. 'improved user retention by 18%').",
            'improveFillers' => 'Replace verbal fillers with a confident 1-second silent pause.',
            'improveClose' => 'Close your answer by summarizing the key takeaway or lesson learned.',
        ];
    }

    private static function ms(): array
    {
        return [
            'strongRelevance' => 'Jawapan anda kekal fokus kepada soalan yang ditanya.',
            'strongClarity' => 'Struktur huraian tersusun dan mudah difahami.',
            'strongSpecificity' => 'Anda memberikan contoh spesifik dengan impak yang meyakinkan.',
            'strongTechnical' => 'Penggunaan istilah bidang anda yang relevan dan tepat.',
            'strongBase' => 'Percubaan yang baik; asas mesej anda telah berjaya disampaikan.',
            'strongTried' => 'Anda sudah mencuba; sekarang huraikan dalam ayat yang lengkap.',
            'weakTooShort' => 'Jawapan terlalu pendek untuk dinilai. Jawab dalam ayat yang lengkap.',
            'weakNoSentences' => 'Jawapan ini tidak berbentuk ayat. Terangkan dengan kata-kata sendiri, bukan senarai perkataan.',
            'weakStuffing' => 'Jawapan berbunyi seperti senarai kata kunci. Terangkan apa yang anda buat dan kenapa ia penting.',
            'weakRepetitive' => 'Perkataan yang sama diulang berkali-kali. Tambah butiran baharu.',
            'weakBrief' => 'Huraian agak ringkas — penemuduga mengharapkan perincian yang lebih mendalam.',
            'weakSpecificity' => 'Kurang contoh metrik atau angka kuantitatif untuk membuktikan hasil.',
            'weakFillers' => "Kadar perkataan 'filler' agak tinggi (%d perkataan penampal).",
            'weakFast' => 'Anda bercakap terlalu laju (%d patah perkataan seminit).',
            'improveStar' => 'Gunakan formula STAR (Situation, Task, Action, Result) secara berurutan.',
            'improveNumber' => "Sertakan sekurang-kurangnya satu metrik bernombor (cth: 'meningkatkan kecekapan sebanyak 25%').",
            'improveFillers' => "Gantikan perkataan 'um/err/macam' dengan jeda senyap (pause) 1 saat.",
            'improveClose' => 'Akhiri jawapan dengan rumusan atau pengajaran utama.',
        ];
    }
}
