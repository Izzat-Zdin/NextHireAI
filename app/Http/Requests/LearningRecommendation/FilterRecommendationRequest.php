<?php

namespace App\Http\Requests\LearningRecommendation;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FilterRecommendationRequest
 *
 * Validates recommendation filter parameters.
 * Owner: Shafinaz & Wani
 */
class FilterRecommendationRequest extends FormRequest
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
            'category' => ['sometimes', 'string'],
            'skill_level' => ['sometimes', 'string', 'in:beginner,intermediate,advanced'],
        ];
    }
}
