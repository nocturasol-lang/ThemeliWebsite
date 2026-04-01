<?php
/**
 * THEMELI — SQLite Database Connection
 */
require_once __DIR__ . '/config.php';

function getDb() {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('sqlite:' . DB_PATH);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->exec('PRAGMA journal_mode=WAL');
        initSchema($pdo);
    }
    return $pdo;
}

function initSchema($pdo) {
    $pdo->exec('CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        name_en TEXT DEFAULT "",
        description TEXT DEFAULT "",
        description_en TEXT DEFAULT "",
        year INTEGER NOT NULL,
        typology TEXT NOT NULL,
        location TEXT DEFAULT "",
        region TEXT DEFAULT "",
        architect TEXT DEFAULT "",
        size TEXT DEFAULT "",
        status TEXT DEFAULT "Completed",
        date_completed TEXT DEFAULT "",
        image_url TEXT DEFAULT "",
        images TEXT DEFAULT "[]",
        map_x REAL,
        map_y REAL
    )');

    // Migration: add region column if missing (existing databases)
    $cols = $pdo->query("PRAGMA table_info(projects)")->fetchAll();
    $colNames = array_column($cols, 'name');
    if (!in_array('region', $colNames)) {
        $pdo->exec('ALTER TABLE projects ADD COLUMN region TEXT DEFAULT ""');
    }
    if (!in_array('images', $colNames)) {
        $pdo->exec('ALTER TABLE projects ADD COLUMN images TEXT DEFAULT "[]"');
    }
    if (!in_array('name_en', $colNames)) {
        $pdo->exec('ALTER TABLE projects ADD COLUMN name_en TEXT DEFAULT ""');
    }
    if (!in_array('description_en', $colNames)) {
        $pdo->exec('ALTER TABLE projects ADD COLUMN description_en TEXT DEFAULT ""');
    }
    if (!in_array('client', $colNames)) {
        $pdo->exec('ALTER TABLE projects ADD COLUMN client TEXT DEFAULT ""');
    }
    if (!in_array('contractor', $colNames)) {
        $pdo->exec('ALTER TABLE projects ADD COLUMN contractor TEXT DEFAULT ""');
    }
    if (!in_array('participation', $colNames)) {
        $pdo->exec('ALTER TABLE projects ADD COLUMN participation TEXT DEFAULT ""');
    }
    if (!in_array('year_start', $colNames)) {
        $pdo->exec('ALTER TABLE projects ADD COLUMN year_start INTEGER');
    }
    if (!in_array('budget', $colNames)) {
        $pdo->exec('ALTER TABLE projects ADD COLUMN budget REAL');
    }
}
