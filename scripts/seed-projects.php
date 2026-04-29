<?php
// One-time seed: copy projects from src/projects-data.js into the SQLite DB
// used by the new PHP backend.
//
//   php scripts/seed-projects.php          # insert (skips existing legacy_ids)
//   php scripts/seed-projects.php --reset  # wipe projects table first
//
// Image URLs in the JS file are PocketBase URLs from the previous backend; they
// are NOT carried over (hero_image and gallery start empty so the admin can
// re-upload). After seeding, log into /admin and click "Δημοσίευση" to
// regenerate src/projects-data.js with relative URLs.

declare(strict_types=1);

// In dev the running PHP server serves dist/, so the live DB is dist/api/data/themeli.sqlite.
// Seed there if dist/api exists; otherwise fall back to public/api (raw source / production).
$projectRoot = dirname(__DIR__);
$distApi = $projectRoot . '/dist/api';
if (is_dir($distApi)) {
    require $distApi . '/common.php';
} else {
    require $projectRoot . '/public/api/common.php';
}

$reset = in_array('--reset', $argv, true);

$jsPath = dirname(__DIR__) . '/src/projects-data.js';
if (!file_exists($jsPath)) {
    fwrite(STDERR, "ERROR: $jsPath not found\n");
    exit(1);
}
$raw = file_get_contents($jsPath);

// Extract the array literal between `const PROJECTS = ` and the trailing `;`.
if (!preg_match('/const\s+PROJECTS\s*=\s*(\[.*\])\s*;/s', $raw, $m)) {
    fwrite(STDERR, "ERROR: could not locate `const PROJECTS = [...]` in $jsPath\n");
    exit(1);
}
$projects = json_decode($m[1], true);
if (!is_array($projects)) {
    fwrite(STDERR, "ERROR: PROJECTS is not valid JSON\n");
    exit(1);
}

echo "Found " . count($projects) . " projects in $jsPath\n";

$pdo = db();
if ($reset) {
    echo "Wiping projects table...\n";
    $pdo->exec("DELETE FROM projects");
}

$existing = [];
foreach ($pdo->query("SELECT legacy_id FROM projects")->fetchAll() as $r) {
    $existing[(int)$r['legacy_id']] = true;
}

$VALID_TYPOLOGIES = ['Buildings','Railways','Roadworks','Tunnels','Industrial & Energy','Utility Networks','Dams','Ports & Marine','Urban Redevelopment'];
$VALID_REGIONS    = ['Attica','Peloponnese','Central Greece','Thessaly','Northern Greece','Crete','Islands'];
$VALID_STATUS     = ['Completed','In Progress','Planning'];

$ins = $pdo->prepare("
    INSERT INTO projects (
        legacy_id, name, name_en, description, description_en,
        year, year_start, typology, location, region, architect, size,
        status, date_completed, client, contractor, participation,
        budget, hero_image, gallery, lat, lng, map_points, visibility
    ) VALUES (
        :legacy_id, :name, :name_en, :description, :description_en,
        :year, :year_start, :typology, :location, :region, :architect, :size,
        :status, :date_completed, :client, :contractor, :participation,
        :budget, '', '[]', :lat, :lng, :map_points, 'Public'
    )
");

$ok = 0; $skipped = 0; $failed = 0;
foreach ($projects as $p) {
    $legacy = (int)($p['id'] ?? 0);
    if (!$legacy || empty($p['name'])) { $failed++; continue; }
    if (isset($existing[$legacy])) { $skipped++; continue; }

    $points = (isset($p['points']) && is_array($p['points']) && count($p['points']) >= 2)
        ? json_encode($p['points'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        : null;

    try {
        $ins->execute([
            ':legacy_id'      => $legacy,
            ':name'           => (string)($p['name']           ?? ''),
            ':name_en'        => (string)($p['name_en']        ?? ''),
            ':description'    => (string)($p['description']    ?? ''),
            ':description_en' => (string)($p['description_en'] ?? ''),
            ':year'           => $p['year']      ? (int)$p['year']      : null,
            ':year_start'     => $p['yearStart'] ? (int)$p['yearStart'] : null,
            ':typology'       => in_array($p['typology'] ?? '', $VALID_TYPOLOGIES, true) ? $p['typology'] : '',
            ':location'       => (string)($p['location']       ?? ''),
            ':region'         => in_array($p['region']   ?? '', $VALID_REGIONS,    true) ? $p['region']   : '',
            ':architect'      => (string)($p['architect']      ?? ''),
            ':size'           => (string)($p['size']           ?? ''),
            ':status'         => in_array($p['status']   ?? '', $VALID_STATUS,     true) ? $p['status']   : 'Completed',
            ':date_completed' => (string)($p['dateCompleted']  ?? ''),
            ':client'         => (string)($p['client']         ?? ''),
            ':contractor'     => (string)($p['contractor']     ?? ''),
            ':participation'  => (string)($p['participation']  ?? ''),
            ':budget'         => isset($p['budget']) && $p['budget'] !== null ? (float)$p['budget'] : null,
            ':lat'            => isset($p['lat']) && $p['lat'] !== null       ? (float)$p['lat']    : null,
            ':lng'            => isset($p['lng']) && $p['lng'] !== null       ? (float)$p['lng']    : null,
            ':map_points'     => $points,
        ]);
        $ok++;
    } catch (PDOException $e) {
        fwrite(STDERR, "  ! legacy_id=$legacy: " . $e->getMessage() . "\n");
        $failed++;
    }
}

echo "Inserted: $ok | Skipped (already present): $skipped | Failed: $failed\n";
echo "DB: " . DB_FILE . "\n";
echo "\nNext steps:\n";
echo "  1. POST /api/auth.php?action=setup with {email, password} to create the admin account\n";
echo "  2. Open /admin to upload hero/gallery images per project\n";
echo "  3. Click Δημοσίευση to regenerate src/projects-data.js with relative URLs\n";
