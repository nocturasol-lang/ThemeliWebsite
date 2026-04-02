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

// Size limit: 10 MB
$maxSize = 10 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    jsonResponse(['error' => 'File too large. Maximum size: 10 MB'], 400);
}

// Validate MIME type
$allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mime, $allowed)) {
    jsonResponse(['error' => 'Invalid file type. Allowed: jpeg, png, webp, gif'], 400);
}

// Validate extension against allowlist
$allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg');
if (!in_array($ext, $allowedExts)) {
    jsonResponse(['error' => 'Invalid file extension'], 400);
}

// Validate it's a real image with sane dimensions
$imgInfo = getimagesize($file['tmp_name']);
if (!$imgInfo || $imgInfo[0] > 8000 || $imgInfo[1] > 8000) {
    jsonResponse(['error' => 'Invalid image or dimensions too large (max 8000x8000)'], 400);
}
$filename = time() . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
$destPath = UPLOADS_DIR . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    jsonResponse(['error' => 'Failed to save file'], 500);
}

jsonResponse(['url' => UPLOADS_URL . '/' . $filename]);
