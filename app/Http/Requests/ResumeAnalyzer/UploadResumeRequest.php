<?php

namespace App\Http\Requests\ResumeAnalyzer;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UploadResumeRequest
 *
 * Validates resume file upload (file type, size).
 * Owner: Shafinaz
 */
class UploadResumeRequest extends FormRequest
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
            'resume' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
        ];
    }
}
