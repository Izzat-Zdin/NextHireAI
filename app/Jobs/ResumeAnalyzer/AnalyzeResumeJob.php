<?php

namespace App\Jobs\ResumeAnalyzer;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\ResumeAnalyzer\Resume;
use App\Services\ResumeAnalyzer\ResumeAnalysisService;

/**
 * AnalyzeResumeJob
 *
 * Background job for processing resume analysis asynchronously.
 * Owner: Shafinaz
 */
class AnalyzeResumeJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The resume instance to analyze.
     */
    public Resume $resume;

    /**
     * Create a new job instance.
     */
    public function __construct(Resume $resume)
    {
        $this->resume = $resume;
    }

    /**
     * Execute the job.
     */
    public function handle(ResumeAnalysisService $service): void
    {
        // TODO: Implement async resume analysis processing
    }
}
