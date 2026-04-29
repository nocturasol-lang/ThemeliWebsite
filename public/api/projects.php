<?php
// Projects CRUD. All endpoints require admin session.

require __DIR__ . '/common.php';
require_admin();

$method = method();
$id     = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Columns the client can write. Everything else is server-managed.
const WRITABLE_FIELDS = [
    'name', 'name_en', 'description', 'description_en',
    'year', 'year_start',
    'typology', 'location', 'region', 'architect', 'size',
    'status', 'date_completed', 'client', 'contractor', 'participation',
    'budget', 'visibility',
    'hero_image', 'gallery',
    'lat', 'lng', 'map_points',
];

const SELECT_FIELDS = "id, legacy_id, name, name_en, description, description_en,
    year, year_start, typology, location, region, architect, size,
    status, date_completed, client, contractor, participation,
    budget, hero_image, gallery, lat, lng, map_points, visibility,
    created_at, updated_at";

function row_to_api(array $r): array {
    $r['gallery']    = json_decode_safe($r['gallery'], []);
    $r['map_points'] = json_decode_safe($r['map_points'], null);
    foreach (['year', 'year_start', 'legacy_id'] as $k) {
        if ($r[$k] !== null) $r[$k] = (int)$r[$k];
    }
    foreach (['budget', 'lat', 'lng'] as $k) {
        if ($r[$k] !== null) $r[$k] = (float)$r[$k];
    }
    return $r;
}

// ── GET (list or single) ─────────────────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        $st = db()->prepare("SELECT " . SELECT_FIELDS . " FROM projects WHERE id = :id");
        $st->execute([':id' => $id]);
        $row = $st->fetch();
        if (!$row) json_err('Not found', 404);
        json_ok(row_to_api($row));
    }
    $rows = db()->query("SELECT " . SELECT_FIELDS . " FROM projects ORDER BY legacy_id ASC")->fetchAll();
    json_ok(array_map('row_to_api', $rows));
}

$body = read_json_body();

function build_payload(array $body): array {
    $out = [];
    foreach (WRITABLE_FIELDS as $f) {
        if (!array_key_exists($f, $body)) continue;
        $v = $body[$f];
        if ($f === 'gallery') {
            $v = is_array($v) ? json_encode(array_values($v), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : '[]';
        } elseif ($f === 'map_points') {
            $v = is_array($v) && count($v) >= 2
                ? json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                : null;
        } elseif (in_array($f, ['year', 'year_start'], true)) {
            $v = ($v === '' || $v === null) ? null : (int)$v;
        } elseif (in_array($f, ['budget', 'lat', 'lng'], true)) {
            $v = ($v === '' || $v === null) ? null : (float)$v;
        } elseif (is_string($v)) {
            $v = trim($v);
        }
        $out[$f] = $v;
    }
    return $out;
}

// ── POST (create) ────────────────────────────────────────────────────
if ($method === 'POST') {
    $payload = build_payload($body);
    if (empty($payload['name'])) json_err('name is required');

    // Auto-assign next legacy_id (admin can override).
    $legacy = isset($body['legacy_id']) ? (int)$body['legacy_id'] : 0;
    if ($legacy <= 0) {
        $legacy = (int)db()->query("SELECT COALESCE(MAX(legacy_id), 0) + 1 FROM projects")->fetchColumn();
    }
    $payload['legacy_id'] = $legacy;
    $payload['updated_at'] = date('Y-m-d H:i:s');

    $cols = array_keys($payload);
    $sql  = 'INSERT INTO projects (' . implode(',', $cols) . ') VALUES (:' . implode(',:', $cols) . ')';
    $st = db()->prepare($sql);
    $bind = [];
    foreach ($payload as $k => $v) $bind[':' . $k] = $v;
    try {
        $st->execute($bind);
    } catch (PDOException $e) {
        json_err('Insert failed: ' . $e->getMessage(), 400);
    }
    $newId = (int)db()->lastInsertId();
    $row = db()->prepare("SELECT " . SELECT_FIELDS . " FROM projects WHERE id = :id");
    $row->execute([':id' => $newId]);
    json_ok(row_to_api($row->fetch()), 201);
}

// ── PATCH (update) ───────────────────────────────────────────────────
if ($method === 'PATCH') {
    if (!$id) json_err('id is required');
    $payload = build_payload($body);
    if (!$payload) json_err('No fields to update');
    $payload['updated_at'] = date('Y-m-d H:i:s');

    $sets = [];
    $bind = [':id' => $id];
    foreach ($payload as $k => $v) {
        $sets[] = "$k = :$k";
        $bind[":$k"] = $v;
    }
    $sql = 'UPDATE projects SET ' . implode(', ', $sets) . ' WHERE id = :id';
    db()->prepare($sql)->execute($bind);

    $row = db()->prepare("SELECT " . SELECT_FIELDS . " FROM projects WHERE id = :id");
    $row->execute([':id' => $id]);
    $r = $row->fetch();
    if (!$r) json_err('Not found', 404);
    json_ok(row_to_api($r));
}

// ── DELETE ───────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    if (!$id) json_err('id is required');
    // Find legacy_id so we can wipe its uploads dir
    $st = db()->prepare("SELECT legacy_id FROM projects WHERE id = :id");
    $st->execute([':id' => $id]);
    $legacy = $st->fetchColumn();
    if ($legacy === false) json_err('Not found', 404);

    db()->prepare("DELETE FROM projects WHERE id = :id")->execute([':id' => $id]);

    // Best-effort cleanup of upload directory.
    $dir = UPLOADS_DIR . '/' . (int)$legacy;
    if (is_dir($dir)) {
        foreach (glob($dir . '/*') ?: [] as $f) @unlink($f);
        @rmdir($dir);
    }
    json_ok(['deleted' => $id]);
}

json_err('Method not allowed', 405);
