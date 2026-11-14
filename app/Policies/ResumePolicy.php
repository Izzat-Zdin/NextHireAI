<?php

namespace App\Policies;

use App\Models\Resume;
use App\Models\User;

/** Replaces the Supabase RLS rules: owners read/insert/delete their own rows, admins may read. */
class ResumePolicy
{
    public function view(User $user, Resume $resume): bool
    {
        // TODO (Shafinaz): benarkan jika resume milik user ini ($resume->user_id === $user->user_id)
        // ATAU user ialah admin ($user->isAdmin()). Lihat InterviewSessionPolicy::view.
        return false;
    }

    public function delete(User $user, Resume $resume): bool
    {
        // TODO (Shafinaz): benarkan HANYA jika $resume->user_id === $user->user_id (admin tidak boleh padam).
        return false;
    }
}
