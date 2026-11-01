<?php

namespace App\Http\Requests\MockInterview;

use Illuminate\Foundation\Http\FormRequest;

class CreateSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'role' => 'required|string',
            'interview_type' => 'required|in:hr,behavioral,technical',
            'language' => 'sometimes|in:en,ms',
            'persona' => 'sometimes|in:neutral,friendly,strict',
            'total_questions' => 'sometimes|integer|min:1|max:10',
        ];
    }
}

