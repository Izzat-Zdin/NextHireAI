<?php

namespace Tests\Unit;

use App\Services\Interview\AnswerEvaluator;
use App\Services\Interview\FillerDetector;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * The server scorer. Expected scores were produced by the browser scorer
 * (resources/js/modules/m3-mock-interview/services/evaluation.ts) on the same input, so a failing
 * case here means the two copies have drifted apart.
 */
class AnswerEvaluatorTest extends TestCase
{
    private const PROBLEM = 'Tell me about a time you solved a difficult problem.';

    public static function scoredAnswers(): array
    {
        return [
            'gibberish' => [self::PROBLEM, 'asdf qwer', 'behavioral', 'Software Engineer', false, 6],
            'keyword list' => [self::PROBLEM, 'project team result api database 25% deploy test kpi metrics framework sql server git action outcome improved', 'behavioral', 'Software Engineer', false, 20],
            'strong STAR answer' => [self::PROBLEM, 'In my last internship at a logistics company, our team had a reporting process that took two days every week. My task was to cut that time. I analysed the steps, wrote a Python script that pulled the data from our SQL database and built the report automatically, and tested it with my supervisor for two weeks. As a result, the report took 20 minutes instead of two days, which saved the team about 15 hours a week.', 'behavioral', 'Software Engineer', false, 83],
            'many fillers' => ['Why do you want to work here?', 'Um, actually I think, like, I want to grow. I actually like the company culture and, you know, basically the people seem nice. I mean the role fits me.', 'hr', '', false, 58],
            'malay customer service' => ['Ceritakan pengalaman anda menyelesaikan masalah pelanggan.', 'Semasa saya bekerja di sebuah hotel, ada pelanggan yang membuat aduan tentang bilik yang kotor. Tugas saya ialah menyelesaikan aduan itu dengan cepat. Saya minta maaf, kemudian saya hubungi bahagian kebersihan dan tukar bilik dalam masa 10 minit. Hasilnya pelanggan itu berpuas hati dan memberi maklum balas lima bintang. Macam mana pun, saya belajar macam-macam daripada pengalaman itu, macam, cara berkomunikasi.', 'behavioral', 'Customer Service Executive', true, 90],
            'one word repeated' => ['How do you prioritise tasks?', str_repeat('good ', 22), 'hr', 'Accountant', false, 20],
            'accountant technical' => ['Explain how you would reconcile a bank statement.', 'I would first compare the bank statement with the ledger and list every difference. Then I check timing items such as outstanding cheques and deposits in transit, and correct any errors in the cash book. Finally I prepare the reconciliation report for my manager before the month-end deadline.', 'technical', 'Accountant', false, 83],
        ];
    }

    #[DataProvider('scoredAnswers')]
    public function test_scores_match_the_browser_scorer(string $question, string $answer, string $type, string $role, bool $malay, int $expected): void
    {
        $this->assertSame($expected, AnswerEvaluator::evaluate($question, $answer, $type, $role, $malay)['overallScore']);
    }

    public function test_empty_answer_scores_zero(): void
    {
        $this->assertSame(0, AnswerEvaluator::evaluate(self::PROBLEM, '   ', 'behavioral', '', false)['overallScore']);
    }

    public function test_short_or_keyword_answers_never_reach_a_passing_score(): void
    {
        foreach (['yes', 'I am good', 'api sql git docker react laravel python java cloud cache bug debug'] as $answer) {
            $this->assertLessThanOrEqual(45, AnswerEvaluator::evaluate(self::PROBLEM, $answer, 'technical', 'Software Engineer', false)['overallScore'], $answer);
        }
    }

    public function test_keyword_stuffing_inside_sentences_is_capped(): void
    {
        $answer = 'I used the api and the database and sql and git and docker and react for the project team result kpi metrics outcome improved achieved';
        $result = AnswerEvaluator::evaluate(self::PROBLEM, $answer, 'technical', 'Software Engineer', false);
        $this->assertLessThanOrEqual(AnswerEvaluator::CAP_STUFFING, $result['overallScore']);
        $this->assertContains('The answer reads like a list of keywords. Explain what you did and why it mattered.', $result['weaknesses']);
    }

    public function test_role_vocabulary_counts_for_non_it_roles(): void
    {
        $answer = 'During my placement I prepared the care plan for each patient, checked vital signs every four hours and followed infection control steps during handover so the ward stayed safe.';
        $nurse = AnswerEvaluator::evaluate('How do you keep patients safe?', $answer, 'technical', 'Staff Nurse', false);
        $none = AnswerEvaluator::evaluate('How do you keep patients safe?', $answer, 'technical', 'Software Engineer', false);
        $this->assertGreaterThan($none['scores']['technicalAccuracy'], $nurse['scores']['technicalAccuracy']);
    }

    public function test_malay_speed_comment_is_in_malay(): void
    {
        $answer = 'Semasa saya menjalani latihan industri, saya perlu menyiapkan laporan mingguan untuk pengurus. Saya buat templat baharu dan hasilnya masa penyediaan berkurang daripada dua jam kepada tiga puluh minit setiap minggu.';
        $result = AnswerEvaluator::evaluate('Ceritakan pencapaian anda.', $answer, 'behavioral', '', true, null, 190);
        $this->assertContains('Anda bercakap terlalu laju (190 patah perkataan seminit).', $result['weaknesses']);
    }

    public function test_client_filler_count_can_only_raise_the_count(): void
    {
        $answer = 'In my last role I organised the weekly report for the team and it went well every week without problems.';
        $this->assertSame(0, AnswerEvaluator::evaluate(self::PROBLEM, $answer, 'hr', '', false, 0)['fillerTotal']);
        $this->assertSame(6, AnswerEvaluator::evaluate(self::PROBLEM, $answer, 'hr', '', false, 6)['fillerTotal']);
        $this->assertSame(0, AnswerEvaluator::evaluate(self::PROBLEM, $answer, 'hr', '', false, -5)['fillerTotal']);
    }

    public function test_malay_macam_is_not_a_filler_in_normal_phrases(): void
    {
        $this->assertSame(0, FillerDetector::detect('Macam mana saya boleh bantu? Saya belajar macam-macam perkara.')['total']);
        $this->assertSame(1, FillerDetector::detect('Saya rasa, macam, kerja ini sesuai.')['total']);
    }

    public function test_actually_and_basically_count_only_at_clause_start_or_when_repeated(): void
    {
        $this->assertSame(0, FillerDetector::detect('I actually led the project myself.')['total']);
        $this->assertSame(1, FillerDetector::detect('Actually, I led the project myself.')['total']);
        $this->assertSame(2, FillerDetector::detect('I basically planned it and basically ran it.')['total']);
    }
}
