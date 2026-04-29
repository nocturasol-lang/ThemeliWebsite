<?php
// Inquiries:
//   POST  (public, no auth)            — submit a new inquiry
//   GET   (admin)                      — list all
//   PATCH ?id=N (admin)                — toggle handled / update notes
//   DELETE ?id=N (admin)               — remove

require __DIR__ . '/common.php';

$method = method();

// ── PUBLIC POST: submit inquiry ──────────────────────────────────────
if ($method === 'POST' && !isset($_GET['action'])) {
    $body = read_json_body();

    // Honeypot — bots fill the hidden `website` field.
    if (!empty(trim((string)($body['website'] ?? '')))) {
        // Pretend success so scrapers don't learn the field name.
        json_ok(['ok' => true]);
    }

    $name    = trim((string)($body['name']    ?? ''));
    $email   = trim((string)($body['email']   ?? ''));
    $phone   = trim((string)($body['phone']   ?? ''));
    $subject = trim((string)($body['subject'] ?? ''));
    $message = trim((string)($body['message'] ?? ''));
    $type    = strtolower(trim((string)($body['inquiry_type'] ?? 'other')));
    if (!in_array($type, ['project','partnership','press','career','other'], true)) $type = 'other';

    if ($name === '')    json_err('Name is required', 422);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Valid email is required', 422);
    if (strlen($message) < 10) json_err('Message must be at least 10 characters', 422);
    if (strlen($name) > 200 || strlen($email) > 200 || strlen($subject) > 200 || strlen($message) > 5000) {
        json_err('Field too long', 422);
    }

    $st = db()->prepare("
        INSERT INTO inquiries (name, email, phone, subject, message, inquiry_type)
        VALUES (:name, :email, :phone, :subject, :message, :type)
    ");
    $st->execute([
        ':name' => $name, ':email' => $email, ':phone' => $phone,
        ':subject' => $subject, ':message' => $message, ':type' => $type,
    ]);
    $newId = (int)db()->lastInsertId();

    json_ok(['id' => $newId], 201);
}

// ── ADMIN-ONLY beyond this point ─────────────────────────────────────
require_admin();

if ($method === 'GET') {
    $rows = db()->query("SELECT id, name, email, phone, subject, message, inquiry_type, handled, notes, created_at
                         FROM inquiries ORDER BY created_at DESC")->fetchAll();
    foreach ($rows as &$r) $r['handled'] = (bool)$r['handled'];
    json_ok($rows);
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($method === 'PATCH') {
    if (!$id) json_err('id is required');
    $body = read_json_body();
    $sets = [];
    $bind = [':id' => $id];
    if (array_key_exists('handled', $body)) { $sets[] = 'handled = :h'; $bind[':h'] = !empty($body['handled']) ? 1 : 0; }
    if (array_key_exists('notes',   $body)) { $sets[] = 'notes   = :n'; $bind[':n'] = (string)$body['notes']; }
    if (!$sets) json_err('No fields to update');
    db()->prepare('UPDATE inquiries SET ' . implode(', ', $sets) . ' WHERE id = :id')->execute($bind);
    json_ok(['updated' => $id]);
}

if ($method === 'DELETE') {
    if (!$id) json_err('id is required');
    db()->prepare('DELETE FROM inquiries WHERE id = :id')->execute([':id' => $id]);
    json_ok(['deleted' => $id]);
}

json_err('Method not allowed', 405);
