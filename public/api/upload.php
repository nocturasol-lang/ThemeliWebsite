<?php
/**
 * THEMELI — Image Upload API
 *
 * POST with multipart/form-data, field: "image"
 * Returns: { "url": "relative/path/to/image.jpg" }
 */
require_once __DIR__ . '/config.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

if (!isset($_FILES['image'])) {
    jsonResponse(['error' => 'No image file provided'], 400);
}

$file = $_FILES['image'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(['error' => 'Upload error: ' . $file['error']], 400);
}

// Validate file type
$allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mime, $allowed)) {
    jsonResponse(['error' => 'Invalid file type. Allowed: jpeg, png, webp, gif'], 400);
}

// Generate unique filename
$ext = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
$ext = strtolower($ext);
$filename = time() . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
$destPath = UPLOADS_DIR . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    jsonResponse(['error' => 'Failed to save file'], 500);
}

jsonResponse(['url' => UPLOADS_URL . '/' . $filename]);
