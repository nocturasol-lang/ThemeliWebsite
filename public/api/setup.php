<?php
/**
 * THEMELI — One-time Admin Setup
 *
 * Visit this page to set the admin password.
 * Delete this file after setup is complete.
 */
require_once __DIR__ . '/config.php';

// If admin.hash already exists, block access
if (file_exists(HASH_PATH)) {
    echo '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;background:#252526;color:#fff">';
    echo '<h2>Admin account already configured.</h2>';
    echo '<p>Delete <code>data/admin.hash</code> if you need to reset the password.</p>';
    echo '</body></html>';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm'] ?? '';

    if (strlen($password) < 6) {
        $error = 'Password must be at least 6 characters.';
    } elseif ($password !== $confirm) {
        $error = 'Passwords do not match.';
    } else {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        file_put_contents(HASH_PATH, $hash);
        echo '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;background:#252526;color:#fff">';
        echo '<h2 style="color:#6abf69">Admin account created!</h2>';
        echo '<p>You can now <a href="../admin/" style="color:#FF731E">log in to the admin panel</a>.</p>';
        echo '<p style="color:#d4574e;margin-top:20px"><strong>Important:</strong> Delete this file (api/setup.php) for security.</p>';
        echo '</body></html>';
        exit;
    }
}
?>
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;padding:40px;background:#252526;color:#fff;display:flex;justify-content:center">
  <div style="width:360px;margin-top:60px">
    <h2 style="margin-bottom:4px">THEMELI</h2>
    <p style="color:rgba(255,255,255,0.5);margin-bottom:30px">Set up admin password</p>
    <?php if (!empty($error)): ?>
      <p style="color:#d4574e;margin-bottom:16px"><?= htmlspecialchars($error) ?></p>
    <?php endif; ?>
    <form method="POST">
      <div style="margin-bottom:16px">
        <label style="display:block;font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:4px">PASSWORD</label>
        <input type="password" name="password" required minlength="6"
               style="width:100%;padding:10px;background:#2e2e2f;border:1px solid rgba(255,255,255,0.1);color:#fff;font-size:14px">
      </div>
      <div style="margin-bottom:24px">
        <label style="display:block;font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:4px">CONFIRM PASSWORD</label>
        <input type="password" name="confirm" required minlength="6"
               style="width:100%;padding:10px;background:#2e2e2f;border:1px solid rgba(255,255,255,0.1);color:#fff;font-size:14px">
      </div>
      <button type="submit"
              style="width:100%;padding:12px;background:none;border:1px solid #FF731E;color:#FF731E;font-size:14px;cursor:pointer;text-transform:uppercase;letter-spacing:0.08em">
        Create Admin Account
      </button>
    </form>
  </div>
</body>
</html>
