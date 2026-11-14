<?php

/**
 * Vercel entry point (vercel-php runtime). vercel.json rewrites every request that is not a static
 * file in public/ to this function, which boots Laravel and handles it.
 */

// Serverless defaults. The function's disk is read-only except /tmp and is not kept between requests,
// so sessions live in cookies, the cache in memory, and Laravel's generated files in /tmp. A value set
// in the Vercel project's Environment Variables wins over these.
$serverlessDefaults = [
    'APP_ENV' => 'production',
    'APP_DEBUG' => 'false',
    'APP_CONFIG_CACHE' => '/tmp/config.php',
    'APP_EVENTS_CACHE' => '/tmp/events.php',
    'APP_PACKAGES_CACHE' => '/tmp/packages.php',
    'APP_ROUTES_CACHE' => '/tmp/routes.php',
    'APP_SERVICES_CACHE' => '/tmp/services.php',
    'VIEW_COMPILED_PATH' => '/tmp/views',
    'CACHE_STORE' => 'array',
    'LOG_CHANNEL' => 'stderr',
    'SESSION_DRIVER' => 'cookie',
    'SESSION_SECURE_COOKIE' => 'true',
    'QUEUE_CONNECTION' => 'sync',
];

foreach ($serverlessDefaults as $key => $value) {
    if (getenv($key) === false && ! isset($_ENV[$key]) && ! isset($_SERVER[$key])) {
        putenv("{$key}={$value}");
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}

// APP_KEY pasted into Vercel sometimes loses its "base64:" prefix. A bare 32-byte base64 key is
// otherwise rejected by Laravel ("Unsupported cipher or incorrect key length"), so restore the prefix.
$appKey = getenv('APP_KEY');
if (is_string($appKey) && $appKey !== '' && ! str_starts_with($appKey, 'base64:')) {
    $decoded = base64_decode($appKey, true);
    if ($decoded !== false && strlen($decoded) === 32) {
        $appKey = 'base64:'.$appKey;
        putenv("APP_KEY={$appKey}");
        $_ENV['APP_KEY'] = $appKey;
        $_SERVER['APP_KEY'] = $appKey;
    }
}

// Newer PHP versions on Vercel print deprecation notices from vendor/config code before Laravel's own
// error handler is installed; never send them to the browser (Laravel still logs real errors).
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);

// Same steps as public/index.php. That file is left out of the Vercel upload (.vercelignore) because
// public/ is also the static output folder, and Vercel would serve its source at "/" instead of running it.
// This file runs as /api/index.php, so Symfony would treat "/api" as the app's base path and strip it
// from every URL: /api/interview/sessions would reach Laravel as /interview/sessions (a page route).
// Present the script as the site-root front controller instead.
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';
$_SERVER['SCRIPT_FILENAME'] = dirname(__DIR__).'/public/index.php';

define('LARAVEL_START', microtime(true));

require __DIR__.'/../vendor/autoload.php';

(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Illuminate\Http\Request::capture());
