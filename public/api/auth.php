<?php
/**
 * THEMELI — Authentication API
 *
 * GET    → check session
 * POST   → login (email + password)
 * DELETE → logout
 */
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET — session check
if ($method === 'GET') {
    jsonResponse(['authenticated' => !empty($_SESSION['admin'])]);
}

// DELETE — logout
if ($method === 'DELETE') {
    $_SESSION = [];
    session_destroy();
    jsonResponse(['ok' => true]);
}

// POST — login
if ($method === 'POST') {
    $body = getJsonBody();
    $password = $body['password'] ?? '';

    // If no admin.hash exists yet, prompt setup
    if (!file_exists(HASH_PATH)) {
        jsonResponse(['error' => 'Admin account not set up. Visit /api/setup.php to create one.'], 403);
    }

    $storedHash = trim(file_get_contents(HASH_PATH));

    if (password_verify($password, $storedHash)) {
        $_SESSION['admin'] = true;
        jsonResponse(['ok' => true]);
    } else {
        jsonResponse(['error' => 'Invalid credentials'], 401);
    }
}

jsonResponse(['error' => 'Method not allowed'], 405);
