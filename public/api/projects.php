<?php
/**
 * THEMELI — Projects REST API
 *
 * GET              → list all projects (or single with ?id=N)
 * POST             → create project(s)
 * PUT              → update project (requires id in body)
 * DELETE ?id=N     → delete project
 */
require_once __DIR__ . '/db.php';

requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
$db = getDb();

// GET — list or single
if ($method === 'GET') {
    $id = $_GET['id'] ?? null;
    if ($id !== null) {
        $stmt = $db->prepare('SELECT * FROM projects WHERE id = ?');
        $stmt->execute([(int)$id]);
        $row = $stmt->fetch();
        if (!$row) jsonResponse(['error' => 'Not found'], 404);
        jsonResponse($row);
    }
    $rows = $db->query('SELECT * FROM projects ORDER BY id')->fetchAll();
    jsonResponse($rows);
}

// POST — create (single object or array)
if ($method === 'POST') {
    $body = getJsonBody();
    if (!$body) jsonResponse(['error' => 'Invalid JSON'], 400);

    // Normalize to array of rows
    $rows = isset($body[0]) ? $body : [$body];

    $sql = 'INSERT INTO projects (name, description, year, typology, location, region, architect, size, status, date_completed, image_url, map_x, map_y)
            VALUES (:name, :description, :year, :typology, :location, :region, :architect, :size, :status, :date_completed, :image_url, :map_x, :map_y)';
    $stmt = $db->prepare($sql);

    $ids = [];
    foreach ($rows as $r) {
        $stmt->execute([
            ':name'           => $r['name'] ?? '',
            ':description'    => $r['description'] ?? '',
            ':year'           => (int)($r['year'] ?? 0),
            ':typology'       => $r['typology'] ?? '',
            ':location'       => $r['location'] ?? '',
            ':region'         => $r['region'] ?? '',
            ':architect'      => $r['architect'] ?? '',
            ':size'           => $r['size'] ?? '',
            ':status'         => $r['status'] ?? 'Completed',
            ':date_completed' => $r['date_completed'] ?? '',
            ':image_url'      => $r['image_url'] ?? '',
            ':map_x'          => isset($r['map_x']) ? (float)$r['map_x'] : null,
            ':map_y'          => isset($r['map_y']) ? (float)$r['map_y'] : null,
        ]);
        $ids[] = (int)$db->lastInsertId();
    }

    jsonResponse(['ok' => true, 'ids' => $ids], 201);
}

// PUT — update
if ($method === 'PUT') {
    $body = getJsonBody();
    if (!$body || !isset($body['id'])) jsonResponse(['error' => 'Missing id'], 400);

    $sql = 'UPDATE projects SET name=:name, description=:description, year=:year, typology=:typology,
            location=:location, region=:region, architect=:architect, size=:size, status=:status,
            date_completed=:date_completed, image_url=:image_url, map_x=:map_x, map_y=:map_y
            WHERE id=:id';
    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':id'             => (int)$body['id'],
        ':name'           => $body['name'] ?? '',
        ':description'    => $body['description'] ?? '',
        ':year'           => (int)($body['year'] ?? 0),
        ':typology'       => $body['typology'] ?? '',
        ':location'       => $body['location'] ?? '',
        ':region'         => $body['region'] ?? '',
        ':architect'      => $body['architect'] ?? '',
        ':size'           => $body['size'] ?? '',
        ':status'         => $body['status'] ?? 'Completed',
        ':date_completed' => $body['date_completed'] ?? '',
        ':image_url'      => $body['image_url'] ?? '',
        ':map_x'          => isset($body['map_x']) ? (float)$body['map_x'] : null,
        ':map_y'          => isset($body['map_y']) ? (float)$body['map_y'] : null,
    ]);

    jsonResponse(['ok' => true]);
}

// DELETE
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) jsonResponse(['error' => 'Missing id'], 400);

    $stmt = $db->prepare('DELETE FROM projects WHERE id = ?');
    $stmt->execute([(int)$id]);

    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
