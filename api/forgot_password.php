<?php
header('Content-Type: application/json');
require_once 'db.php';
require_once 'mailer.php';

$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');

// Respuesta genérica sin importar si el correo existe o no — así este
// endpoint no se puede usar para averiguar qué correos están registrados
// (mismo criterio que resend_verification.php).
$generic = ['success' => true, 'message' => 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.'];

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode($generic);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, username FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode($generic);
        exit;
    }

    // Límite básico: no reenviar más de una vez por minuto.
    $stmtLast = $pdo->prepare("SELECT created_at FROM password_resets WHERE user_id = ? ORDER BY created_at DESC LIMIT 1");
    $stmtLast->execute([$user['id']]);
    $last = $stmtLast->fetchColumn();
    if ($last && (time() - strtotime($last)) < 60) {
        echo json_encode($generic);
        exit;
    }

    $pdo->prepare("DELETE FROM password_resets WHERE user_id = ?")->execute([$user['id']]);

    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + 3600);
    $pdo->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)")
        ->execute([$user['id'], $token, $expiresAt]);

    $host = $_SERVER['HTTP_HOST'] ?? '';
    $resetUrl = "https://{$host}/restablecer-contrasena?token={$token}";
    send_password_reset_email($email, $user['username'], $resetUrl);

    echo json_encode($generic);
} catch (Exception $e) {
    echo json_encode($generic);
}
