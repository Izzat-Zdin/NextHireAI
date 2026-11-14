<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnswerAttempt;
use App\Models\AnswerEvaluation;
use App\Models\AudioAnalysis;
use App\Models\FacialAnalysis;
use App\Models\InterviewAnswer;
use App\Models\InterviewQuestion;
use App\Models\InterviewSession;
use App\Models\InterviewSessionSummary;
use App\Models\Report;
use App\Services\Interview\AnswerEvaluator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Module 3: AI Mock Interview Engine persistence.
 *
 * Questions are picked in the browser and the browser shows each score instantly, but the score that is
 * stored is always recomputed here (App\Services\Interview\AnswerEvaluator) from the saved answer text.
 * Each answer is saved as soon as it is submitted, so a closed tab or a paused session loses nothing.
 */
class InterviewSessionController extends Controller
{
    /** Longest answer or transcript accepted, in characters (about 10 minutes of speech). */
    public const MAX_ANSWER_CHARS = 5000;

    /** New sessions one user may start per hour. */
    public const MAX_SESSIONS_PER_HOUR = 20;

    private const DB_TYPE_TO_ENGINE = ['HR' => 'hr', 'Tech' => 'technical', 'Behaviour' => 'behavioral'];

    /** GET /api/interview/sessions?limit= : rows from the interview_session_summaries VIEW, newest first. */
    public function index(Request $request): JsonResponse
    {
        $limit = min(500, max(1, (int) $request->query('limit', 100)));
        $rows = InterviewSessionSummary::where('user_id', $request->user()->user_id)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        return response()->json($rows);
    }

    /** POST /api/interview/sessions : creates the session and its questions. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'role' => ['required', 'string', 'max:120'],
            'interview_type' => ['required', 'in:HR,Tech,Behaviour'],
            'language' => ['required', 'in:BI,Malay'],
            'persona' => ['required', 'in:neutral,friendly,strict'],
            'questions' => ['required', 'array', 'min:1', 'max:30'],
            'questions.*.question_no' => ['required', 'integer', 'min:1', 'max:30', 'distinct'],
            'questions.*.question_text' => ['required', 'string', 'max:1000'],
            'questions.*.question_type' => ['required', 'string', 'max:40'],
        ]);

        // Rate limit kept in the database, so it also holds on serverless hosting where the cache is per request.
        $recent = InterviewSession::where('user_id', $request->user()->user_id)
            ->where('created_at', '>=', now()->subHour())
            ->count();
        abort_if($recent >= self::MAX_SESSIONS_PER_HOUR, 429, 'You have started many interviews in the last hour. Please wait a while before starting another.');

        $result = DB::transaction(function () use ($data, $request) {
            $session = InterviewSession::create([
                'user_id' => $request->user()->user_id,
                'role' => $data['role'],
                'interview_type' => $data['interview_type'],
                'language' => $data['language'],
                'persona' => $data['persona'],
                'status' => 'Active',
            ]);

            $questions = [];
            foreach ($data['questions'] as $q) {
                $row = InterviewQuestion::create([
                    'session_id' => $session->session_id,
                    'question_no' => $q['question_no'],
                    'question_text' => $q['question_text'],
                    'question_type' => $q['question_type'],
                ]);
                $questions[] = ['question_id' => $row->question_id, 'question_no' => $row->question_no];
            }

            return ['session_id' => $session->session_id, 'questions' => $questions];
        });

        return response()->json($result, 201);
    }

    /** GET /api/interview/sessions/{session} : summary + questions + answers (with evaluation/audio) + report. */
    public function show(Request $request, InterviewSession $session): JsonResponse
    {
        $this->authorize('view', $session);

        $summary = InterviewSessionSummary::find($session->session_id);
        $questions = $session->questions()->get(['question_id', 'question_no', 'question_text']);
        $answers = $session->answers()->with(['evaluation', 'audioAnalysis'])->get();
        $report = $session->report()->first(['strengths_summary', 'weaknesses_summary', 'generated_at']);

        $items = $questions->map(function (InterviewQuestion $question) use ($answers) {
            // Latest answer wins if a question was ever answered more than once.
            $answer = $answers->where('question_id', $question->question_id)->last();
            $evaluation = $answer?->evaluation;
            $audio = $answer?->audioAnalysis;

            return [
                'questionNo' => $question->question_no,
                'question' => $question->question_text,
                'answer' => $answer?->answer_text,
                'evaluation' => $evaluation ? [
                    'overall_score' => $evaluation->overall_score,
                    'strengths' => $evaluation->strengths,
                    'weaknesses' => $evaluation->weaknesses,
                    'improvements' => $evaluation->improvements,
                    'ai_source' => $evaluation->ai_source,
                ] : null,
                'audio' => $audio ? [
                    'word_count' => $audio->word_count,
                    'speaking_rate' => $audio->speaking_rate,
                    'filler_total' => $audio->filler_total,
                ] : null,
            ];
        });

        return response()->json([
            'session' => $summary,
            'report' => $report,
            'items' => $items,
        ]);
    }

    /**
     * POST /api/interview/sessions/{session}/answers : saves one submitted answer straight away.
     * Answering the same question again replaces the earlier answer (and its attempt, score and metrics).
     */
    public function saveAnswer(Request $request, InterviewSession $session): JsonResponse
    {
        $this->authorize('update', $session);
        $item = $request->validate($this->answerRules(''));

        $saved = DB::transaction(function () use ($session, $item) {
            $locked = $this->lockOpenSession($session);
            $question = $locked->questions()->where('question_id', $item['question_id'])->first();
            abort_unless($question, 422, 'This question does not belong to the session.');

            return $this->writeAnswer($locked, $question, $item);
        });

        return response()->json($saved);
    }

    /**
     * POST /api/interview/sessions/{session}/resume : reopens a paused or interrupted session and returns
     * everything the interview room needs to continue from the first unanswered question.
     */
    public function resume(Request $request, InterviewSession $session): JsonResponse
    {
        $this->authorize('update', $session);
        abort_unless(in_array($session->status, ['Active', 'Pause'], true), 409, 'Only a paused or unfinished session can be continued.');

        if ($session->status === 'Pause') {
            $session->status = 'Active';
            $session->save();
        }

        $questions = $session->questions()->get(['question_id', 'question_no', 'question_text', 'question_type']);
        $answers = $session->answers()->with(['evaluation', 'audioAnalysis', 'attempts'])->get()
            ->groupBy('question_id')
            ->map(fn ($rows) => $rows->last())
            ->values()
            ->map(fn (InterviewAnswer $a) => [
                'question_id' => $a->question_id,
                'answer_text' => $a->answer_text,
                'answer_method' => $a->answer_method,
                'attempt_no' => $a->attempts->max('attempt_no') ?? 1,
                'overall_score' => $a->evaluation?->overall_score,
                'speaking_rate' => $a->audioAnalysis?->speaking_rate,
                'silence_count' => $a->audioAnalysis?->silence_count,
                'filler_total' => $a->audioAnalysis?->filler_total,
            ]);

        return response()->json([
            'session' => $session->only(['session_id', 'role', 'interview_type', 'language', 'persona', 'status']),
            'questions' => $questions,
            'answers' => $answers,
        ]);
    }

    /**
     * POST /api/interview/sessions/{session}/finish : saves any answers not saved yet (for example skipped
     * questions), writes the report from the stored scores, and marks the session as finished.
     */
    public function finish(Request $request, InterviewSession $session): JsonResponse
    {
        $this->authorize('update', $session);

        $data = $request->validate([
            'answers' => ['present', 'array', 'max:30'],
            ...$this->answerRules('answers.*.'),
        ]);

        DB::transaction(function () use ($data, $session) {
            $locked = $this->lockOpenSession($session);
            $questions = $locked->questions()->get()->keyBy('question_id');

            foreach ($data['answers'] as $item) {
                $question = $questions->get($item['question_id']);
                if (! $question) {
                    continue; // never attach an answer to a question of another session
                }
                $this->writeAnswer($locked, $question, $item);
            }

            // The report summarises the stored (server-computed) evaluations, never text sent by the browser.
            $evaluations = AnswerEvaluation::whereIn('answer_id', InterviewAnswer::where('session_id', $locked->session_id)->select('answer_id'))->get();
            Report::create([
                'session_id' => $locked->session_id,
                'strengths_summary' => $this->topLines($evaluations->pluck('strengths')),
                'weaknesses_summary' => $this->topLines($evaluations->pluck('weaknesses')),
                'pdf_path' => null,
            ]);

            $locked->status = 'Finish';
            $locked->save();
        });

        return response()->json(['ok' => true]);
    }

    /** POST /api/interview/sessions/{session}/cancel : Active or Pause → Cancel (user discarded the session). */
    public function cancel(Request $request, InterviewSession $session): JsonResponse
    {
        $this->authorize('update', $session);
        if (in_array($session->status, ['Active', 'Pause'], true)) {
            $session->status = 'Cancel';
            $session->save();
        }

        return response()->json(['ok' => true]);
    }

    /** POST /api/interview/sessions/{session}/pause : Active → Pause (user chose "Save and continue later"). */
    public function pause(Request $request, InterviewSession $session): JsonResponse
    {
        $this->authorize('update', $session);
        if ($session->status === 'Active') {
            $session->status = 'Pause';
            $session->save();
        }

        return response()->json(['ok' => true]);
    }

    /** DELETE /api/interview/sessions/{session} : cascades to questions, answers, scores, report. */
    public function destroy(Request $request, InterviewSession $session): JsonResponse
    {
        $this->authorize('delete', $session);
        $session->delete();

        return response()->json(null, 204);
    }

    /** Validation rules for one answer. Any score or feedback the browser sends is ignored, so none is validated. */
    private function answerRules(string $prefix): array
    {
        $max = self::MAX_ANSWER_CHARS;

        return [
            "{$prefix}question_id" => ['required', 'uuid'],
            "{$prefix}answer_text" => ['nullable', 'string', "max:{$max}"],
            "{$prefix}answer_method" => ['required', 'in:Text,Audio,Video'],
            "{$prefix}attempt_no" => ['required', 'integer', 'min:1', 'max:50'],
            "{$prefix}audio" => ['nullable', 'array'],
            "{$prefix}audio.speaking_rate" => ['nullable', 'numeric', 'min:0', 'max:400'],
            "{$prefix}audio.filler_total" => ['nullable', 'integer', 'min:0', 'max:2000'],
            "{$prefix}audio.silence_count" => ['nullable', 'integer', 'min:0', 'max:500'],
            "{$prefix}facial" => ['nullable', 'array'],
            "{$prefix}facial.dominant_expression" => ['nullable', 'string', 'max:40'],
            "{$prefix}facial.nervous_percent" => ['nullable', 'numeric', 'min:0', 'max:100'],
            "{$prefix}facial.confidence_score" => ['nullable', 'numeric', 'min:0', 'max:100'],
            "{$prefix}facial.raw_metrics" => ['nullable', 'array', 'max:20'],
        ];
    }

    /** Re-reads the session with a row lock and refuses one that is already finished or cancelled. */
    private function lockOpenSession(InterviewSession $session): InterviewSession
    {
        $locked = InterviewSession::whereKey($session->session_id)->lockForUpdate()->firstOrFail();
        abort_if($locked->status === 'Finish', 409, 'This session is already saved.');
        abort_if($locked->status === 'Cancel', 409, 'This session was discarded and can no longer be changed.');

        return $locked;
    }

    /**
     * Writes one answer with its attempt, server-computed evaluation, speech metrics and facial metrics,
     * replacing any earlier answer to the same question.
     *
     * @return array{answer_id:string, overall_score:int|null}
     */
    private function writeAnswer(InterviewSession $session, InterviewQuestion $question, array $item): array
    {
        // Cascades to answer_attempts, answer_evaluations, audio_analyses and facial_analyses.
        InterviewAnswer::where('session_id', $session->session_id)->where('question_id', $question->question_id)->delete();

        $text = isset($item['answer_text']) ? trim($item['answer_text']) : null;
        $answered = $text !== null && $text !== '' && ! str_starts_with($text, '[Skipped');

        $answer = InterviewAnswer::create([
            'session_id' => $session->session_id,
            'question_id' => $question->question_id,
            'answer_text' => $answered ? $text : null,
            'answer_method' => $item['answer_method'],
            'file_path' => null,
        ]);

        AnswerAttempt::create([
            'question_id' => $question->question_id,
            'answer_id' => $answer->answer_id,
            'attempt_no' => $item['attempt_no'],
        ]);

        if (! $answered) {
            return ['answer_id' => $answer->answer_id, 'overall_score' => null];
        }

        $audio = $item['audio'] ?? null;
        $spoken = $item['answer_method'] !== 'Text';
        $result = AnswerEvaluator::evaluate(
            $question->question_text,
            $text,
            self::DB_TYPE_TO_ENGINE[$question->question_type] ?? (self::DB_TYPE_TO_ENGINE[$session->interview_type] ?? 'behavioral'),
            $session->role === 'General' ? '' : $session->role,
            $session->language === 'Malay',
            isset($audio['filler_total']) ? (int) $audio['filler_total'] : null,
            $spoken && isset($audio['speaking_rate']) ? (float) $audio['speaking_rate'] : null,
        );

        AnswerEvaluation::create([
            'answer_id' => $answer->answer_id,
            'overall_score' => $result['overallScore'],
            'strengths' => implode("\n", $result['strengths']),
            'weaknesses' => implode("\n", $result['weaknesses']),
            'improvements' => implode("\n", $result['improvements']),
            'ai_source' => 'Rule-based',
        ]);

        if ($audio !== null) {
            AudioAnalysis::create([
                'answer_id' => $answer->answer_id,
                'transcript' => $text,
                'word_count' => count(preg_split('/\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY)),
                'speaking_rate' => $spoken && isset($audio['speaking_rate']) ? (float) $audio['speaking_rate'] : null,
                'filler_total' => $result['fillerTotal'],
                'silence_count' => $audio['silence_count'] ?? null,
            ]);
        }

        if (! empty($item['facial'])) {
            $f = $item['facial'];
            FacialAnalysis::create([
                'answer_id' => $answer->answer_id,
                'dominant_expression' => $f['dominant_expression'] ?? null,
                'nervous_percent' => $f['nervous_percent'] ?? null,
                'confidence_score' => $f['confidence_score'] ?? null,
                'raw_metrics' => $f['raw_metrics'] ?? null,
            ]);
        }

        return ['answer_id' => $answer->answer_id, 'overall_score' => $result['overallScore']];
    }

    /** The three lines that occur most often across the given newline-separated texts. */
    private function topLines($texts): ?string
    {
        $counts = [];
        foreach ($texts as $text) {
            foreach (preg_split('/\R/', (string) $text, -1, PREG_SPLIT_NO_EMPTY) as $line) {
                $counts[$line] = ($counts[$line] ?? 0) + 1;
            }
        }
        if (! $counts) {
            return null;
        }
        arsort($counts);

        return implode("\n", array_slice(array_keys($counts), 0, 3));
    }
}
