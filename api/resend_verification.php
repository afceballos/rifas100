<?php
header('Content-Type: application/json');
require_once 'db.php';
require_once 'mailer.php';

$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');

// Respuesta genérica sin importar si el correo existe, está verificado, o no
// hay ninguna cuenta con ese correo — así no se puede usar este endpoint para
// averiguar qué correos están registrados.
$generic = ['success' => true, 'message' => 'Si el correo está registrado y pendiente de verificar, te enviamos un nuevo enlace.'];

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode($generic);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, username, email_verified_at FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || $user['email_verified_at'] !== null) {
        echo json_encode($generic);
        exit;
    }

    // Límite básico: no reenviar más de una vez por minuto.
    $stmtLast = $pdo->prepare("SELECT created_at FROM email_verifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1");
    $stmtLast->execute([$user['id']]);
    $last = $stmtLast->fetchColumn();
    if ($last && (time() - strtotime($last)) < 60) {
        echo json_encode($generic);
        exit;
    }

    $pdo->prepare("DELETE FROM email_verifications WHERE user_id = ?")->execute([$user['id']]);

    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + 86400);
    $pdo->prepare("INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)")
        ->execute([$user['id'], $token, $expiresAt]);

    $host = $_SERVER['HTTP_HOST'] ?? '';
    $verifyUrl = "https://{$host}/verificar-correo?token={$token}";
    send_verification_email($email, $user['username'], $verifyUrl);

    echo json_encode($generic);
} catch (Exception $e) {
    echo json_encode($generic);
}
