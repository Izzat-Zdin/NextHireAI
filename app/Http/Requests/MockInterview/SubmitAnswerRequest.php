<?php

namespace App\Http\Requests\MockInterview;

use Illuminate\Foundation\Http\FormRequest;

class SubmitAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'question_no' => 'required|integer',
            'answer_text' => 'required|string',
            'duration_seconds' => 'sometimes|numeric',
            'answer_method' => 'sometimes|in:text,audio,video',
        ];
    }
}

