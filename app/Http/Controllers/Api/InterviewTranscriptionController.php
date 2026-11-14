<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * POST /api/interview/transcribe : sends one spoken answer's audio to Deepgram with filler words kept,
 * and returns that transcript. The interview room uses it only to count "um", "uh", "hmm" and similar
 * sounds that the browser's own speech recognition leaves out. The audio is not stored.
 *
 * Off unless DEEPGRAM_API_KEY is set (the room then never calls it).
 */
class InterviewTranscriptionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $key = config('services.deepgram.key');
        abort_unless(filled($key), 503, 'Filler transcription is not configured.');

        $data = $request->validate([
            // 4 MB keeps the request under the hosting body limit; that is several minutes of Opus audio.
            'audio' => ['required', 'file', 'max:4096', 'mimetypes:audio/webm,video/webm,audio/ogg,audio/mp4,audio/mpeg,audio/wav,audio/x-wav,application/octet-stream'],
            'language' => ['required', 'in:en,ms'],
        ]);

        $file = $data['audio'];
        $response = Http::withHeaders(['Authorization' => 'Token '.$key])
            ->timeout(25)
            ->withBody(file_get_contents($file->getRealPath()), $file->getMimeType() ?: 'audio/webm')
            ->post('https://api.deepgram.com/v1/listen?'.http_build_query([
                'model' => config('services.deepgram.model', 'nova-2'),
                'language' => $data['language'],
                'filler_words' => 'true',
                'punctuate' => 'true',
            ]));

        if (! $response->successful()) {
            Log::warning('Deepgram transcription failed', ['status' => $response->status(), 'body' => mb_substr($response->body(), 0, 300)]);
            abort(502, 'The filler transcription service did not respond.');
        }

        return response()->json([
            'transcript' => (string) $response->json('results.channels.0.alternatives.0.transcript', ''),
        ]);
    }
}
