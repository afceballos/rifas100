<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);
$raffle_id = isset($data['raffle_id']) ? (int)$data['raffle_id'] : 0;
$seller_id = isset($data['seller_id']) ? (int)$data['seller_id'] : 0;
$password = trim($data['password'] ?? '');

if ($raffle_id <= 0 || $seller_id <= 0 || strlen($password) < 6) {
    echo json_encode(['success' => false, 'error' => 'La contraseña debe tener al menos 6 caracteres']);
    exit;
}

assert_raffle_ownership($pdo, $raffle_id);

try {
    $stmtOwner = $pdo->prepare("SELECT id FROM sellers WHERE id = ? AND raffle_id = ?");
    $stmtOwner->execute([$seller_id, $raffle_id]);
    if (!$stmtOwner->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Vendedor no encontrado']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE sellers SET password_hash = ? WHERE id = ?");
    $stmt->execute([$hash, $seller_id]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al guardar la contraseña']);
}
