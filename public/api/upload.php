<?php
// Image upload for project hero/gallery.
//
// POST multipart/form-data:
//   project_id  (int, required) — legacy_id of the project
//   file        (file,  required)
//   kind        ("hero" | "gallery") — informational; storage is identical
//
// Response: { filename: "<stored-name>.ext", url: "/uploads/projects/<id>/<stored-name>.ext" }

require __DIR__ . '/common.php';
require_admin();

if (method() !== 'POST') json_err('Method not allowed', 405);

$projectId = (int)($_POST['project_id'] ?? 0);
if ($projectId <= 0) json_err('project_id is required');

if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $code = $_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE;
    json_err('Upload failed (code ' . (int)$code . ')');
}

$file = $_FILES['file'];
if ($file['size'] > 10 * 1024 * 1024) json_err('File too large (max 10 MB)');

// MIME sniff via fileinfo
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime  = $finfo ? finfo_file($finfo, $file['tmp_name']) : ($file['type'] ?? '');
if ($finfo) finfo_close($finfo);

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowed = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/avif' => 'avif',
];
if (!isset($allowed[$mime])) json_err('Unsupported image type: ' . $mime, 415);
if ($ext === '' || $ext === 'jpeg') $ext = $allowed[$mime];

$base   = pathinfo($file['name'], PATHINFO_FILENAME);
$base   = safe_filename($base);
$rand   = substr(bin2hex(random_bytes(4)), 0, 8);
$stored = $base . '_' . $rand . '.' . $ext;

$destDir = UPLOADS_DIR . '/' . $projectId;
if (!is_dir($destDir) && !@mkdir($destDir, 0775, true)) json_err('Cannot create upload dir');

$destPath = $destDir . '/' . $stored;
if (!move_uploaded_file($file['tmp_name'], $destPath)) json_err('Failed to store file');
@chmod($destPath, 0644);

json_ok([
    'filename' => $stored,
    'url'      => '/uploads/projects/' . $projectId . '/' . rawurlencode($stored),
]);
