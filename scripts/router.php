<?php
// Router for `php -S` that mimics dist/.htaccess so extensionless URLs work
// in local development. Production Apache handles this via mod_rewrite.

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
$root = __DIR__ . '/../dist';
$abs  = $root . $path;

// Real file (PHP, image, css, js, etc.) — let the built-in server handle it.
if (is_file($abs)) return false;

// Directory: serve its index.html if present.
if (is_dir($abs)) {
    $idx = rtrim($abs, '/') . '/index.html';
    if (is_file($idx)) {
        $_SERVER['SCRIPT_NAME'] = rtrim($path, '/') . '/index.html';
        require $idx;
        return true;
    }
    return false;
}

// Extensionless URL → try with .html appended.
$html = $abs . '.html';
if (is_file($html)) {
    $_SERVER['SCRIPT_NAME'] = $path . '.html';
    require $html;
    return true;
}

// Fallback — mimic the .htaccess ErrorDocument rules: Greek 404 under /el/,
// English otherwise, with a real 404 status.
http_response_code(404);
$notFound = $root . (preg_match("#^/el(/|$)#", $path) ? "/el/404.html" : "/en/404.html");
if (is_file($notFound)) { readfile($notFound); return true; }
return false;
