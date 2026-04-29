<?php
// Admin auth: login, logout, status, first-run setup.
// All responses are JSON.

require __DIR__ . '/common.php';

start_session();
$action = $_GET['action'] ?? '';

// ── GET: status check ────────────────────────────────────────────────
if (method() === 'GET') {
    // Detect "displaced" sessions (someone else logged in and superseded
    // this one) before is_admin() destroys the session, so the client
    // can show an informative popup instead of a silent re-login.
    $displaced = false;
    if (!empty($_SESSION['admin_email'])) {
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
    $token = bin2hex(random_bytes(32));
    db()->prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_active_session', :t)")
        ->execute([':t' => $token]);
    $_SESSION['admin_email']   = $email;
    $_SESSION['session_token'] = $token;
    $_SESSION['last_activity'] = time();
    json_ok(['email' => $email]);
}

// ── Logout ───────────────────────────────────────────────────────────
if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    json_ok(['ok' => true]);
}

// ── Login ────────────────────────────────────────────────────────────
$email = trim((string)($body['email']    ?? ''));
$pass  = (string)($body['password'] ?? '');
if ($email === '' || $pass === '') json_err('Email and password required');

$rows = db()->query("SELECT key, value FROM settings WHERE key IN ('admin_email','admin_password_hash')")->fetchAll();
$cfg = [];
foreach ($rows as $r) $cfg[$r['key']] = $r['value'];

if (empty($cfg['admin_email']) || empty($cfg['admin_password_hash'])) {
    json_err('Admin not configured. Visit /api/setup-admin first.', 403);
}
if (strcasecmp($email, $cfg['admin_email']) !== 0 || !password_verify($pass, $cfg['admin_password_hash'])) {
    // Tiny delay to discourage brute force on shared hosting.
    usleep(300000);
    json_err('Invalid credentials', 401);
}

// Single-session: bump the active token so any other session is invalidated.
$token = bin2hex(random_bytes(32));
db()->prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_active_session', :t)")
    ->execute([':t' => $token]);
$_SESSION['admin_email']   = $cfg['admin_email'];
$_SESSION['session_token'] = $token;
$_SESSION['last_activity'] = time();
json_ok(['email' => $cfg['admin_email']]);
