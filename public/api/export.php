<?php
/**
 * THEMELI — Export / Publish Projects
 *
 * GET → regenerates projects-data.js from the database
 */
require_once __DIR__ . '/db.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$rows = getDb()->query('SELECT * FROM projects ORDER BY id')->fetchAll();

// Build the JS file content
$output = "/**\n * THEMELI — Projects Data\n * Edit via admin panel or directly in this file.\n */\nconst PROJECTS = [\n";

foreach ($rows as $i => $r) {
    $output .= "  {\n";
    $output .= "    id: " . (int)$r['id'] . ",\n";
    $output .= "    name: " . json_encode($r['name']) . ",\n";
    $output .= "    description: " . json_encode($r['description'] ?? '') . ",\n";
    $output .= "    year: " . (int)$r['year'] . ",\n";
    $output .= "    typology: " . json_encode($r['typology']) . ",\n";
    $output .= "    location: " . json_encode($r['location'] ?? '') . ",\n";
    $output .= "    region: " . json_encode($r['region'] ?? '') . ",\n";
    $output .= "    architect: " . json_encode($r['architect'] ?? '') . ",\n";
    $output .= "    size: " . json_encode($r['size'] ?? '') . ",\n";
    $output .= "    status: " . json_encode($r['status'] ?? '') . ",\n";
    $output .= "    dateCompleted: " . json_encode($r['date_completed'] ?? '') . ",\n";
    $output .= "    image: " . json_encode($r['image_url'] ?? '') . ",\n";
    $output .= "    mapX: " . ($r['map_x'] !== null ? (float)$r['map_x'] : 'null') . ",\n";
    $output .= "    mapY: " . ($r['map_y'] !== null ? (float)$r['map_y'] : 'null') . "\n";
    $output .= "  }" . ($i < count($rows) - 1 ? "," : "") . "\n";
}

$output .= "];\n";

// Write projects-data.js to the web root (and src/ if available locally)
if (HOSTING_MODE === 'hostinger') {
    $targets = [
        $_SERVER['DOCUMENT_ROOT'] . '/projects-data.js',
    ];
} else {
    $targets = [
        __DIR__ . '/../../src/projects-data.js',
        __DIR__ . '/../../dist/projects-data.js',
    ];
}

$written = 0;
foreach ($targets as $target) {
    $dir = dirname($target);
    if (is_dir($dir)) {
        file_put_contents($target, $output);
        $written++;
    }
}

jsonResponse(['ok' => true, 'count' => count($rows), 'files_written' => $written]);
