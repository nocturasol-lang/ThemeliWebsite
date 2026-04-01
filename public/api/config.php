<?php
/**
 * THEMELI — API Configuration
 */

// Ensure PHP errors return JSON, not HTML
set_error_handler(function ($severity, $message, $file, $line) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => $message, 'file' => basename($file), 'line' => $line]);
    exit;
});
set_exception_handler(function ($e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => $e->getMessage()]);
    exit;
});

// ── Hosting mode ──────────────────────────────────────────────
// Set to 'hostinger' when deployed, 'local' for php -S development
define('HOSTING_MODE', 'local');

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

// Session
session_start();

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
