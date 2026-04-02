<?php
/**
 * THEMELI — API Configuration
 */

// Ensure PHP errors return JSON, not HTML
set_error_handler(function ($severity, $message, $file, $line) {
    http_response_code(500);
    header('Content-Type: application/json');
    $data = ['error' => 'Internal server error'];
    // Only include debug info in local development
    if (php_sapi_name() === 'cli-server') {
        $data = ['error' => $message, 'file' => basename($file), 'line' => $line];
    }
    echo json_encode($data);
    exit;
});
set_exception_handler(function ($e) {
    http_response_code(500);
    header('Content-Type: application/json');
    $msg = (php_sapi_name() === 'cli-server') ? $e->getMessage() : 'Internal server error';
    echo json_encode(['error' => $msg]);
    exit;
});

// ── Hosting mode ──────────────────────────────────────────────
// Auto-detect: 'hostinger' on production, 'local' for php -S development
$detectedMode = (php_sapi_name() === 'cli-server' || ($_SERVER['SERVER_NAME'] ?? '') === 'localhost')
    ? 'local'
    : 'hostinger';
define('HOSTING_MODE', getenv('HOSTING_MODE') ?: $detectedMode);

if (HOSTING_MODE === 'hostinger') {
    // Hostinger: data outside public_html, uploads inside it
    define('DB_PATH', $_SERVER['DOCUMENT_ROOT'] . '/../data/themeli.sqlite');
    define('HASH_PATH', $_SERVER['DOCUMENT_ROOT'] . '/../data/admin.hash');
    define('UPLOADS_DIR', $_SERVER['DOCUMENT_ROOT'] . '/uploads/project-images');
    define('UPLOADS_URL', '../../uploads/project-images');
} else {
    // Local: relative to api/ directory
    define('DB_PATH', __DIR__ . '/../../data/themeli.sqlite');
    define('HASH_PATH', __DIR__ . '/../../data/admin.hash');
    define('UPLOADS_DIR', __DIR__ . '/../../uploads/project-images');
    define('UPLOADS_URL', '../../uploads/project-images');
}

// Ensure directories exist
if (!is_dir(dirname(DB_PATH))) {
    mkdir(dirname(DB_PATH), 0755, true);
}
if (!is_dir(UPLOADS_DIR)) {
    mkdir(UPLOADS_DIR, 0755, true);
}

// Session — secure cookie settings
session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Strict',
    'cookie_secure'   => (HOSTING_MODE === 'hostinger'),
]);

// JSON helpers
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function requireAuth() {
    if (empty($_SESSION['admin'])) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
}

function getJsonBody() {
    return json_decode(file_get_contents('php://input'), true);
}
