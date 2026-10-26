<?php
// Admin auth: login, logout, status, first-run setup.
// All responses are JSON.

require __DIR__ . '/common.php';

// Only resume an existing session; anonymous status checks never create one.
if (has_session_cookie()) start_session();
$action = $_GET['action'] ?? '';

// ── GET: status check ────────────────────────────────────────────────
if (method() === 'GET') {
    // Detect "displaced" sessions (someone else logged in and superseded
    // this one) before is_admin() destroys the session, so the client
    // can show an informative popup instead of a silent re-login.
    $displaced = false;
    if (session_status() === PHP_SESSION_ACTIVE && !empty($_SESSION['admin_email'])) {
        $myToken = $_SESSION['session_token'] ?? '';
        $active  = active_session_token();
        if ($myToken && $active && !hash_equals($active, $myToken)) {
            $displaced = true;
        }
    }
    $resp = [
        'authenticated' => is_admin(),
        'admin_exists'  => admin_exists(),
        'email'         => $_SESSION['admin_email'] ?? null,
    ];
    if ($displaced) $resp['reason'] = 'displaced';
    json_ok($resp);
}

if (method() !== 'POST') json_err('Method not allowed', 405);

$body = read_json_body();

// ── First-run setup: create the admin account when none exists ───────
if ($action === 'setup') {
    if (admin_exists()) json_err('Admin already exists', 409);
    $email = trim((string)($body['email']    ?? ''));
    $pass  = (string)($body['password'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Invalid email');
    if (strlen($pass) < 8) json_err('Password must be at least 8 characters');
    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $st = db()->prepare("INSERT INTO settings (key, value) VALUES ('admin_email', :e), ('admin_password_hash', :h)");
    $st->execute([':e' => $email, ':h' => $hash]);
    begin_admin_session($email);
    json_ok(['email' => $email]);
}

// ── Logout ───────────────────────────────────────────────────────────
if ($action === 'logout') {
    if (session_status() === PHP_SESSION_ACTIVE) destroy_admin_session();
    json_ok(['ok' => true]);
}

// ── Login ────────────────────────────────────────────────────────────
// Brute-force guard: max LOGIN_MAX_FAILS failed attempts per IP per window.
const LOGIN_MAX_FAILS = 5;
const LOGIN_WINDOW    = 15 * 60;
if (rate_limited('login', LOGIN_MAX_FAILS, LOGIN_WINDOW)) {
    json_err('Too many failed attempts. Try again in 15 minutes.', 429);
}

$email = trim((string)($body['email']    ?? ''));
$pass  = (string)($body['password'] ?? '');
if ($email === '' || $pass === '') json_err('Email and password required');

$rows = db()->query("SELECT key, value FROM settings WHERE key IN ('admin_email','admin_password_hash')")->fetchAll();
$cfg = [];
foreach ($rows as $r) $cfg[$r['key']] = $r['value'];

if (empty($cfg['admin_email']) || empty($cfg['admin_password_hash'])) {
    json_err('Admin not configured.', 403);
}
if (strcasecmp($email, $cfg['admin_email']) !== 0 || !password_verify($pass, $cfg['admin_password_hash'])) {
    rate_hit('login');
    usleep(300000);
    json_err('Invalid credentials', 401);
}

rate_clear('login');
// Single-session: bumps the active token so any other session is invalidated.
begin_admin_session($cfg['admin_email']);
json_ok(['email' => $cfg['admin_email']]);
