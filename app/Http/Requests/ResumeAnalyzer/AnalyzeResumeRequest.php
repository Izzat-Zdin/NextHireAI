<?php

namespace App\Http\Requests\ResumeAnalyzer;

use Illuminate\Foundation\Http\FormRequest;

/**
 * AnalyzeResumeRequest
 *
 * Validates resume analysis request parameters.
 * Owner: Shafinaz
 */
class AnalyzeResumeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'resume_id' => ['required', 'string', 'exists:resume,id'],
        ];
    }
}
