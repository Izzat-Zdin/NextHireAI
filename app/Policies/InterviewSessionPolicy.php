<?php

namespace App\Policies;

use App\Models\InterviewSession;
use App\Models\User;

/** Replaces the Supabase RLS rules for interview_sessions and its child tables. */
class InterviewSessionPolicy
{
    public function view(User $user, InterviewSession $session): bool
    {
        return $session->user_id === $user->user_id || $user->isAdmin();
    }

    public function update(User $user, InterviewSession $session): bool
    {
        return $session->user_id === $user->user_id;
    }

    public function delete(User $user, InterviewSession $session): bool
    {
        return $session->user_id === $user->user_id;
    }
}
