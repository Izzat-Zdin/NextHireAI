<?php

/*
|--------------------------------------------------------------------------
| NextHire AI settings
|--------------------------------------------------------------------------
| Mirrors the optional VITE_TEST_* settings of the original app, but the
| passwords stay on the server: the login page only shows the buttons and
| the backend signs the account in.
*/
return [
    // Whether new accounts must click the emailed verification link before using the app
    // (like Supabase's "Confirm email" switch). Off by default for local testing.
    'require_email_verification' => (bool) env('AUTH_REQUIRE_EMAIL_VERIFICATION', false),

    'test_accounts_enabled' => env('APP_ENV') === 'local' || (bool) env('TEST_ACCOUNTS_IN_PRODUCTION', false),

    'test_accounts' => [
        'user' => [
            'name' => env('TEST_ACCOUNT_NAME', 'Ali Test'),
            'email' => env('TEST_ACCOUNT_EMAIL'),
            'password' => env('TEST_ACCOUNT_PASSWORD'),
        ],
        'admin' => [
            'name' => env('TEST_ADMIN_NAME', 'Admin Test'),
            'email' => env('TEST_ADMIN_EMAIL'),
            'password' => env('TEST_ADMIN_PASSWORD'),
        ],
    ],

    // Disk + folder for uploaded resumes. Local default: storage/app/private/resumes/<user_id>/<file>.
    // On Vercel the local disk is not kept between requests, so use RESUME_DISK=supabase with
    // RESUME_FOLDER= (empty): files then go to the Supabase Storage bucket `resumes` as <user_id>/<file>,
    // the same layout as the React app, so its older uploads become downloadable here too.
    'resume_disk' => env('RESUME_DISK', 'local'),
    'resume_folder' => env('RESUME_FOLDER', 'resumes'),
];
