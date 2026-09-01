<?php
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$token = isset($data['token']) ? trim($data['token']) : '';
$password = (string)($data['password'] ?? '');

if ($token === '') {
    echo json_encode(['success' => false, 'message' => 'Enlace de restablecimiento inválido.']);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT user_id, expires_at FROM password_resets WHERE token = ?");
    $stmt->execute([$token]);
    $row = $stmt->fetch();

    if (!$row) {
        echo json_encode(['success' => false, 'message' => 'El enlace de restablecimiento no es válido o ya fue usado.']);
        exit;
    }

    if (strtotime($row['expires_at']) < time()) {
        echo json_encode(['success' => false, 'code' => 'expired', 'message' => 'El enlace de restablecimiento venció. Solicita uno nuevo.']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([$hash, $row['user_id']]);
    // Se invalidan todos los enlaces pendientes de este usuario, no solo el usado.
    $pdo->prepare("DELETE FROM password_resets WHERE user_id = ?")->execute([$row['user_id']]);

    echo json_encode(['success' => true, 'message' => 'Contraseña actualizada. Ya puedes iniciar sesión.']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error al restablecer la contraseña.']);
}
