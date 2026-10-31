<?php
// THEMELI — shared bootstrap for every endpoint.
// Sets up the SQLite connection, session, and JSON helpers.

declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);

// ─── Paths ────────────────────────────────────────────────────────────
define('API_DIR',     __DIR__);
define('DATA_DIR',    API_DIR . '/data');
define('PUBLIC_DIR',  dirname(API_DIR));
define('UPLOADS_DIR', PUBLIC_DIR . '/uploads/projects');
define('DATA_FILE',   PUBLIC_DIR . '/projects-data.js');
define('DB_FILE',     DATA_DIR . '/themeli.sqlite');

if (!is_dir(DATA_DIR))    @mkdir(DATA_DIR, 0775, true);
if (!is_dir(UPLOADS_DIR)) @mkdir(UPLOADS_DIR, 0775, true);

// ─── DB ───────────────────────────────────────────────────────────────
function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('sqlite:' . DB_FILE);
        $pdo->setAttribute(PDO::ATTR_ERRMODE,   PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA journal_mode = WAL');
        ensure_schema($pdo);
    }
    return $pdo;
}

function ensure_schema(PDO $pdo): void {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT
        );

        CREATE TABLE IF NOT EXISTS projects (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            legacy_id       INTEGER UNIQUE NOT NULL,
            name            TEXT NOT NULL,
            name_en         TEXT DEFAULT '',
            description     TEXT DEFAULT '',
            description_en  TEXT DEFAULT '',
            year            INTEGER,
            year_start      INTEGER,
            typology        TEXT DEFAULT '',
            location        TEXT DEFAULT '',
            region          TEXT DEFAULT '',
            architect       TEXT DEFAULT '',
            size            TEXT DEFAULT '',
            status          TEXT DEFAULT 'Completed',
            date_completed  TEXT DEFAULT '',
            client          TEXT DEFAULT '',
            contractor      TEXT DEFAULT '',
            participation   TEXT DEFAULT '',
            budget          REAL,
            hero_image      TEXT DEFAULT '',
            gallery         TEXT DEFAULT '[]',
            lat             REAL,
            lng             REAL,
            map_points      TEXT,
            visibility      TEXT DEFAULT 'Public',
            created_at      TEXT DEFAULT (datetime('now')),
            updated_at      TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_projects_legacy_id  ON projects(legacy_id);
        CREATE INDEX IF NOT EXISTS idx_projects_visibility ON projects(visibility);

        CREATE TABLE IF NOT EXISTS inquiries (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            name          TEXT NOT NULL,
            email         TEXT NOT NULL,
            phone         TEXT DEFAULT '',
            subject       TEXT DEFAULT '',
            message       TEXT NOT NULL,
            inquiry_type  TEXT DEFAULT 'other',
            handled       INTEGER DEFAULT 0,
            notes         TEXT DEFAULT '',
            created_at    TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_inquiries_handled ON inquiries(handled);
        CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at);

        CREATE TABLE IF NOT EXISTS rate_limits (
            bucket      TEXT NOT NULL,
            client      TEXT NOT NULL,
            created_at  INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_rate_limits ON rate_limits(bucket, client, created_at);
    ");
}

// ─── Request origin (CSRF) ───────────────────────────────────────────
// Browsers attach Sec-Fetch-Site / Origin to every state-changing fetch.
// Reject anything a browser reports as coming from another site; requests
// without either header (curl, server-side scripts) can't carry the admin
// cookie cross-site, so they're allowed through.
function require_same_origin(): void {
    if (in_array(method(), ['GET', 'HEAD', 'OPTIONS'], true)) return;
    $site = $_SERVER['HTTP_SEC_FETCH_SITE'] ?? '';
    if ($site !== '' && $site !== 'same-origin' && $site !== 'none') {
        json_err('Cross-site request blocked', 403);
    }
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') {
        $host = parse_url($origin, PHP_URL_HOST);
        $port = parse_url($origin, PHP_URL_PORT);
        if ($port) $host .= ':' . $port;
        if (!is_string($host) || strcasecmp($host, $_SERVER['HTTP_HOST'] ?? '') !== 0) {
            json_err('Cross-site request blocked', 403);
        }
    }
}
require_same_origin();

// ─── Rate limiting ───────────────────────────────────────────────────
// Sliding window per client IP (stored hashed). rate_hit() records an
// attempt; rate_limited() checks whether the window is already full.
function rate_client(): string {
    return hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . DB_FILE);
}

function rate_limited(string $bucket, int $max, int $window): bool {
    $st = db()->prepare("SELECT COUNT(*) FROM rate_limits WHERE bucket = :b AND client = :c AND created_at > :t");
    $st->execute([':b' => $bucket, ':c' => rate_client(), ':t' => time() - $window]);
    return (int)$st->fetchColumn() >= $max;
}

function rate_hit(string $bucket): void {
    db()->prepare("INSERT INTO rate_limits (bucket, client, created_at) VALUES (:b, :c, :t)")
        ->execute([':b' => $bucket, ':c' => rate_client(), ':t' => time()]);
    // Occasional cleanup of anything older than a day.
    if (random_int(1, 50) === 1) {
        db()->prepare("DELETE FROM rate_limits WHERE created_at < :t")->execute([':t' => time() - 86400]);
    }
}

function rate_clear(string $bucket): void {
    db()->prepare("DELETE FROM rate_limits WHERE bucket = :b AND client = :c")
        ->execute([':b' => $bucket, ':c' => rate_client()]);
}

// ─── Session / auth ──────────────────────────────────────────────────
const SESSION_NAME = 'themeli_admin';

// Anonymous visitors never get a session: only resume one when the
// browser already holds our cookie (i.e. after a login).
function has_session_cookie(): bool {
    return !empty($_COOKIE[SESSION_NAME]);
}

function start_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    // Refuse session IDs the server didn't issue (blocks session fixation).
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => !empty($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name(SESSION_NAME);
    session_start();
}

// Called right after a successful login/setup: issue a fresh session ID
// so any ID that existed before authentication becomes worthless.
function begin_admin_session(string $email): void {
    start_session();
    session_regenerate_id(true);
    $token = bin2hex(random_bytes(32));
    db()->prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_active_session', :t)")
        ->execute([':t' => $token]);
    $_SESSION['admin_email']   = $email;
    $_SESSION['session_token'] = $token;
    $_SESSION['last_activity'] = time();
}

// Auto-logout after this many seconds of inactivity.
const ADMIN_IDLE_TIMEOUT = 30 * 60;

function destroy_admin_session(): void {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

function active_session_token(): string {
    $row = db()->query("SELECT value FROM settings WHERE key = 'admin_active_session'")->fetch();
    return $row['value'] ?? '';
}

function is_admin(): bool {
    if (!has_session_cookie()) return false;
    start_session();
    if (empty($_SESSION['admin_email'])) return false;
    // Single-session: only the most recent login is valid; older sessions
    // get logged out as soon as they make a request.
    $myToken     = $_SESSION['session_token'] ?? '';
    $activeToken = active_session_token();
    if (!$myToken || !$activeToken || !hash_equals($activeToken, $myToken)) {
        destroy_admin_session();
        return false;
    }
    $last = $_SESSION['last_activity'] ?? 0;
    if ($last && (time() - $last) > ADMIN_IDLE_TIMEOUT) {
        destroy_admin_session();
        return false;
    }
    $_SESSION['last_activity'] = time();
    return true;
}

function require_admin(): void {
    if (!is_admin()) json_err('Unauthorized', 401);
}

function admin_exists(): bool {
    $row = db()->query("SELECT value FROM settings WHERE key = 'admin_password_hash'")->fetch();
    return !empty($row['value']);
}

// ─── JSON helpers ────────────────────────────────────────────────────
function json_ok($data = null, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_err(string $msg, int $code = 400, $extra = null): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    $body = ['ok' => false, 'error' => $msg];
    if ($extra !== null) $body['details'] = $extra;
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function read_json_body(): array {
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') return [];
    $data = json_decode($raw, true);
    if (!is_array($data)) json_err('Invalid JSON body', 400);
    return $data;
}

// ─── Email ───────────────────────────────────────────────────────────
const MAIL_FROM_ADDRESS  = 'noreply@themeli.gr';
const INQUIRY_NOTIFY_MAX = 20;
const INQUIRY_ADMIN_URL  = 'https://themeli.gr/manage-7fk3/inquiries.html';

// FILTER_VALIDATE_EMAIL alone is not enough for mail headers: it accepts quoted
// local parts holding a backslash-escaped newline, which would inject headers.
function is_safe_email(string $email): bool {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false
        && !preg_match('/[\x00-\x20\x7F"\\\\]/', $email);
}

// Returns whether the mail server accepted the message, not whether it arrived.
// Subject and body are safe for visitor text; an unsafe $replyTo is left out.
function send_utf8_mail(string $to, string $subject, string $body, string $replyTo = ''): bool {
    $subject = trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $subject) ?? '');
    $encoded = function_exists('mb_encode_mimeheader')
        ? mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n")
        : '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $fromName = '=?UTF-8?B?' . base64_encode('Ιστοσελίδα ΘΕΜΕΛΗ') . '?=';

    $headers = [
        'From: ' . $fromName . ' <' . MAIL_FROM_ADDRESS . '>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
    ];
    if (is_safe_email($replyTo)) {
        $headers[] = 'Reply-To: ' . $replyTo;
    }
    $ok = @mail($to, $encoded, chunk_split(base64_encode($body)), implode("\r\n", $headers), '-f' . MAIL_FROM_ADDRESS);
    if (!$ok) error_log('[themeli] mail() failed for a notification');
    return $ok;
}

function inquiry_notify_emails(): array {
    $st = db()->prepare("SELECT value FROM settings WHERE key = 'inquiry_notify_emails'");
    $st->execute();
    $row = $st->fetch();
    $list = json_decode_safe($row['value'] ?? null, []);
    return array_values(array_filter($list, static fn($e) => is_string($e) && filter_var($e, FILTER_VALIDATE_EMAIL)));
}

// Never throws: a mail problem must not fail the visitor's submission,
// which is already saved and visible in the admin.
function notify_new_inquiry(int $id, array $q): void {
    try {
        $labels = ['project' => 'Νέο Έργο', 'partnership' => 'Συνεργασία', 'press' => 'Δημοσιογραφία', 'career' => 'Καριέρα', 'other' => 'Άλλο'];
        $type = $labels[$q['type']] ?? $labels['other'];
        $name = function_exists('mb_substr') ? mb_substr($q['name'], 0, 80) : substr($q['name'], 0, 80);
        $subject = 'Νέο αίτημα επικοινωνίας: ' . $type . ' – ' . $name;
        $body = "Νέο αίτημα από τη φόρμα επικοινωνίας του themeli.gr.\n\n"
            . "Τύπος: {$type}\n"
            . "Όνομα: {$q['name']}\n"
            . "Email: {$q['email']}\n"
            . ($q['phone']   !== '' ? "Τηλέφωνο: {$q['phone']}\n" : '')
            . ($q['subject'] !== '' ? "Θέμα: {$q['subject']}\n"   : '')
            . "\nΜήνυμα:\n{$q['message']}\n\n"
            . "Αίτημα #{$id}. Δείτε το στο διαχειριστικό:\n" . INQUIRY_ADMIN_URL . "\n";
        foreach (inquiry_notify_emails() as $to) {
            send_utf8_mail($to, $subject, $body, $q['email']);
        }
    } catch (Throwable $e) {
        error_log('[themeli] inquiry notification failed: ' . $e->getMessage());
    }
}

// ─── Misc ────────────────────────────────────────────────────────────
function method(): string { return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'); }

function safe_filename(string $name): string {
    $name = preg_replace('/[^A-Za-z0-9._-]/', '_', $name) ?? 'file';
    $name = trim($name, '._');
    if ($name === '') $name = 'file';
    return substr($name, 0, 80);
}

function json_decode_safe(?string $s, $default = null) {
    if ($s === null || $s === '') return $default;
    $v = json_decode($s, true);
    return is_array($v) ? $v : $default;
}

