<?php
header('Content-Type: application/json');
require_once 'db.php';

$token = isset($_GET['token']) ? trim($_GET['token']) : '';

if ($token === '') {
    echo json_encode(['success' => false, 'message' => 'Enlace de verificación inválido.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT user_id, expires_at FROM email_verifications WHERE token = ?");
    $stmt->execute([$token]);
    $row = $stmt->fetch();

    if (!$row) {
        echo json_encode(['success' => false, 'message' => 'El enlace de verificación no es válido o ya fue usado.']);
        exit;
    }

    if (strtotime($row['expires_at']) < time()) {
        echo json_encode(['success' => false, 'code' => 'expired', 'message' => 'El enlace de verificación venció. Solicita uno nuevo.']);
        exit;
    }

    $pdo->prepare("UPDATE users SET email_verified_at = NOW() WHERE id = ?")->execute([$row['user_id']]);
    // Se invalidan todos los tokens pendientes de este usuario, no solo el usado.
    $pdo->prepare("DELETE FROM email_verifications WHERE user_id = ?")->execute([$row['user_id']]);

    echo json_encode(['success' => true, 'message' => 'Correo verificado. Ya puedes iniciar sesión.']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error al verificar el correo.']);
}
