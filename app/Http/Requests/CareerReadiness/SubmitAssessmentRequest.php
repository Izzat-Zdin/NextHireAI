<?php

namespace App\Http\Requests\CareerReadiness;

use Illuminate\Foundation\Http\FormRequest;

/**
 * SubmitAssessmentRequest
 *
 * Validates career readiness assessment submission.
 * Owner: Izzat
 */
class SubmitAssessmentRequest extends FormRequest
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
            'session_id' => ['required', 'string'],
            'answers' => ['required', 'array'],
        ];
    }
}
