<?php
// Who gets an email when the contact form receives a new inquiry (admin only).
//   GET                 — current list
//   PUT  {emails: []}   — replace the list (empty list turns notifications off)
//   POST ?action=test   — send a test message to the saved list

require __DIR__ . '/common.php';

require_admin();
$method = method();

if ($method === 'GET') {
    json_ok(['emails' => inquiry_notify_emails()]);
}

if ($method === 'PUT') {
    $body = read_json_body();
    $list = $body['emails'] ?? null;
    if (!is_array($list)) json_err('emails must be a list', 422);

    $clean = [];
    foreach ($list as $item) {
        $addr = strtolower(trim((string)$item));
        if ($addr === '') continue;
        if (strlen($addr) > 200 || !filter_var($addr, FILTER_VALIDATE_EMAIL)) {
            json_err('Μη έγκυρο email: ' . mb_substr($addr, 0, 100), 422);
        }
        $clean[$addr] = true;
    }
    $clean = array_keys($clean);
    if (count($clean) > INQUIRY_NOTIFY_MAX) {
        json_err('Το μέγιστο είναι ' . INQUIRY_NOTIFY_MAX . ' διευθύνσεις', 422);
    }

    db()->prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('inquiry_notify_emails', :v)")
        ->execute([':v' => json_encode($clean, JSON_UNESCAPED_UNICODE)]);
    json_ok(['emails' => $clean]);
}

if ($method === 'POST' && ($_GET['action'] ?? '') === 'test') {
    if (rate_limited('notify_test', 5, 3600)) json_err('Πολλές δοκιμές. Δοκιμάστε ξανά αργότερα.', 429);
    rate_hit('notify_test');

    $emails = inquiry_notify_emails();
    if (!$emails) json_err('Η λίστα είναι κενή. Αποθηκεύστε πρώτα μια διεύθυνση.', 422);

    $results = [];
    foreach ($emails as $to) {
        $results[$to] = send_utf8_mail(
            $to,
            'Δοκιμή ειδοποιήσεων ιστοσελίδας ΘΕΜΕΛΗ',
            "Αυτό είναι δοκιμαστικό μήνυμα από το διαχειριστικό της ιστοσελίδας themeli.gr.\n\n"
            . "Οι ειδοποιήσεις για νέα αιτήματα επικοινωνίας θα φτάνουν σε αυτή τη διεύθυνση."
        );
    }
    json_ok(['results' => $results]);
}

json_err('Method not allowed', 405);
