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

// Validate numeric fields in a project row
function validateProjectRow($r) {
    $year = (int)($r['year'] ?? 0);
    if ($year !== 0 && ($year < 1900 || $year > 2100)) {
        jsonResponse(['error' => 'Invalid year: must be between 1900 and 2100'], 400);
    }
    if (isset($r['year_start'])) {
        $ys = (int)$r['year_start'];
        if ($ys < 1900 || $ys > 2100) {
            jsonResponse(['error' => 'Invalid year_start: must be between 1900 and 2100'], 400);
        }
    }
    if (isset($r['map_x']) && ($r['map_x'] < 0 || $r['map_x'] > 100)) {
        jsonResponse(['error' => 'Invalid map_x: must be between 0 and 100'], 400);
    }
    if (isset($r['map_y']) && ($r['map_y'] < 0 || $r['map_y'] > 100)) {
        jsonResponse(['error' => 'Invalid map_y: must be between 0 and 100'], 400);
    }
    if (isset($r['map_x2']) && ($r['map_x2'] < 0 || $r['map_x2'] > 100)) {
        jsonResponse(['error' => 'Invalid map_x2: must be between 0 and 100'], 400);
    }
    if (isset($r['map_y2']) && ($r['map_y2'] < 0 || $r['map_y2'] > 100)) {
        jsonResponse(['error' => 'Invalid map_y2: must be between 0 and 100'], 400);
    }
}

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

    $sql = 'INSERT INTO projects (name, name_en, description, description_en, year, typology, location, region, architect, size, status, date_completed, image_url, images, map_x, map_y, map_x2, map_y2, map_points, client, contractor, participation, year_start, budget)
            VALUES (:name, :name_en, :description, :description_en, :year, :typology, :location, :region, :architect, :size, :status, :date_completed, :image_url, :images, :map_x, :map_y, :map_x2, :map_y2, :map_points, :client, :contractor, :participation, :year_start, :budget)';
    $stmt = $db->prepare($sql);

    $ids = [];
    foreach ($rows as $r) {
        validateProjectRow($r);
        $stmt->execute([
            ':name'           => $r['name'] ?? '',
            ':name_en'        => $r['name_en'] ?? '',
            ':description'    => $r['description'] ?? '',
            ':description_en' => $r['description_en'] ?? '',
            ':year'           => (int)($r['year'] ?? 0),
            ':typology'       => $r['typology'] ?? '',
            ':location'       => $r['location'] ?? '',
            ':region'         => $r['region'] ?? '',
            ':architect'      => $r['architect'] ?? '',
            ':size'           => $r['size'] ?? '',
            ':status'         => $r['status'] ?? 'Completed',
            ':date_completed' => $r['date_completed'] ?? '',
            ':image_url'      => $r['image_url'] ?? '',
            ':images'         => $r['images'] ?? '[]',
            ':map_x'          => isset($r['map_x']) ? (float)$r['map_x'] : null,
            ':map_y'          => isset($r['map_y']) ? (float)$r['map_y'] : null,
            ':map_x2'         => isset($r['map_x2']) ? (float)$r['map_x2'] : null,
            ':map_y2'         => isset($r['map_y2']) ? (float)$r['map_y2'] : null,
            ':map_points'     => $r['map_points'] ?? null,
            ':client'         => $r['client'] ?? '',
            ':contractor'     => $r['contractor'] ?? '',
            ':participation'  => $r['participation'] ?? '',
            ':year_start'     => isset($r['year_start']) ? (int)$r['year_start'] : null,
            ':budget'         => isset($r['budget']) ? (float)$r['budget'] : null,
        ]);
        $ids[] = (int)$db->lastInsertId();
    }

    jsonResponse(['ok' => true, 'ids' => $ids], 201);
}

// PUT — update
if ($method === 'PUT') {
    $body = getJsonBody();
    if (!$body || !isset($body['id'])) jsonResponse(['error' => 'Missing id'], 400);
    validateProjectRow($body);

    $sql = 'UPDATE projects SET name=:name, name_en=:name_en, description=:description, description_en=:description_en, year=:year, typology=:typology,
            location=:location, region=:region, architect=:architect, size=:size, status=:status,
            date_completed=:date_completed, image_url=:image_url, images=:images, map_x=:map_x, map_y=:map_y, map_x2=:map_x2, map_y2=:map_y2, map_points=:map_points,
            client=:client, contractor=:contractor, participation=:participation, year_start=:year_start, budget=:budget
            WHERE id=:id';
    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':id'             => (int)$body['id'],
        ':name'           => $body['name'] ?? '',
        ':name_en'        => $body['name_en'] ?? '',
        ':description'    => $body['description'] ?? '',
        ':description_en' => $body['description_en'] ?? '',
        ':year'           => (int)($body['year'] ?? 0),
        ':typology'       => $body['typology'] ?? '',
        ':location'       => $body['location'] ?? '',
        ':region'         => $body['region'] ?? '',
        ':architect'      => $body['architect'] ?? '',
        ':size'           => $body['size'] ?? '',
        ':status'         => $body['status'] ?? 'Completed',
        ':date_completed' => $body['date_completed'] ?? '',
        ':image_url'      => $body['image_url'] ?? '',
        ':images'         => $body['images'] ?? '[]',
        ':map_x'          => isset($body['map_x']) ? (float)$body['map_x'] : null,
        ':map_y'          => isset($body['map_y']) ? (float)$body['map_y'] : null,
        ':map_x2'         => isset($body['map_x2']) ? (float)$body['map_x2'] : null,
        ':map_y2'         => isset($body['map_y2']) ? (float)$body['map_y2'] : null,
        ':map_points'     => $body['map_points'] ?? null,
        ':client'         => $body['client'] ?? '',
        ':contractor'     => $body['contractor'] ?? '',
        ':participation'  => $body['participation'] ?? '',
        ':year_start'     => isset($body['year_start']) ? (int)$body['year_start'] : null,
        ':budget'         => isset($body['budget']) ? (float)$body['budget'] : null,
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
