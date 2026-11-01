# Interview & Career Readiness Assessment

**Owner:** Izzat

## Description
Assessment module to evaluate user's interview and career readiness level, calculate readiness metrics, provide structured STAR analysis, and generate actionable feedback reports.

## Folder Structure
```
interview-readiness/
├── pages/
│   ├── ReadinessAssessment.tsx
│   └── AssessmentResult.tsx
├── components/
│   ├── AssessmentForm.tsx
│   ├── AssessmentQuestion.tsx
│   ├── OverallScore.tsx
│   ├── PerformanceMetrics.tsx
│   ├── QuestionFeedback.tsx
│   └── FullReport.tsx
├── services/
│   └── assessmentService.ts
├── types.ts
├── ReadinessAssessmentModule.tsx
└── README.md
```

## Backend Mapping (Laravel)
- **Controller**: `app/Http/Controllers/ReadinessAssessmentController.php`
- **Models**: `InterviewSession`, `InterviewQuestion`, `InterviewAnswer`, `AnswerEvaluation`, `Report`
- **Services**: `ReadinessAssessmentService`, `ReadinessAIService`, `ReadinessReportService`
- **Routes**: `/career-readiness`, `/career-readiness/result/{id}`

