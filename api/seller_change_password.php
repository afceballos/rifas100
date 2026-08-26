<?php
require_once 'seller_auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_seller_auth($pdo);

$data = json_decode(file_get_contents('php://input'), true);
$currentPassword = trim($data['current_password'] ?? '');
$newPassword = trim($data['new_password'] ?? '');

if (strlen($newPassword) < 6) {
    echo json_encode(['success' => false, 'error' => 'La nueva contraseña debe tener al menos 6 caracteres']);
    exit;
}

try {
    $seller_id = current_seller_id();
    $stmt = $pdo->prepare("SELECT password_hash FROM sellers WHERE id = ?");
    $stmt->execute([$seller_id]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($currentPassword, $row['password_hash'])) {
        echo json_encode(['success' => false, 'error' => 'Contraseña actual incorrecta']);
        exit;
    }

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt2 = $pdo->prepare("UPDATE sellers SET password_hash = ? WHERE id = ?");
    $stmt2->execute([$hash, $seller_id]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al cambiar la contraseña']);
}
