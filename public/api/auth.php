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
    // Rate limiting: max 5 attempts per 5 minutes
    if (!isset($_SESSION['login_attempts'])) {
        $_SESSION['login_attempts'] = 0;
        $_SESSION['login_first_attempt'] = time();
    }
    if ($_SESSION['login_attempts'] >= 5) {
        $elapsed = time() - $_SESSION['login_first_attempt'];
        if ($elapsed < 300) {
            jsonResponse(['error' => 'Too many login attempts. Try again in ' . ceil((300 - $elapsed) / 60) . ' minutes.'], 429);
        }
        // Window expired — reset
        $_SESSION['login_attempts'] = 0;
        $_SESSION['login_first_attempt'] = time();
    }

    $body = getJsonBody();
    $password = $body['password'] ?? '';
    $email = strtolower(trim($body['email'] ?? ''));
    $adminEmail = 'admin@themeli.gr';

    if ($email !== $adminEmail) {
        $_SESSION['login_attempts']++;
        jsonResponse(['error' => 'Invalid credentials'], 401);
    }

    // If no admin.hash exists yet, prompt setup
    if (!file_exists(HASH_PATH)) {
        jsonResponse(['error' => 'Admin account not set up. Visit /api/setup.php to create one.'], 403);
    }

    $storedHash = trim(file_get_contents(HASH_PATH));

    if (password_verify($password, $storedHash)) {
        session_regenerate_id(true);
        $_SESSION['login_attempts'] = 0;
        $_SESSION['admin'] = true;
        jsonResponse(['ok' => true]);
    } else {
        $_SESSION['login_attempts']++;
        jsonResponse(['error' => 'Invalid credentials'], 401);
    }
}

jsonResponse(['error' => 'Method not allowed'], 405);
