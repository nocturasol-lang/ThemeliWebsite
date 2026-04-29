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
    ");
}

// ─── Session / auth ──────────────────────────────────────────────────
function start_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => !empty($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('themeli_admin');
    session_start();
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

