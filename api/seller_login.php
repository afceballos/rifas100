<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$code = isset($data['code']) ? strtoupper(trim($data['code'])) : '';
$pass = trim($data['password'] ?? '');

if ($code === '' || $pass === '') {
    echo json_encode(['success' => false, 'message' => 'Ingresa tu código y tu contraseña']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT s.id, s.raffle_id, s.password_hash, r.seller_portal_enabled
        FROM sellers s
        JOIN raffles r ON r.id = s.raffle_id
        WHERE s.code = ?
    ");
    $stmt->execute([$code]);
    $row = $stmt->fetch();

    if (!$row || !$row['password_hash'] || !password_verify($pass, $row['password_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Código o contraseña incorrectos']);
        exit;
    }

    if (!$row['seller_portal_enabled']) {
        echo json_encode(['success' => false, 'message' => 'El acceso de vendedores está deshabilitado para esta rifa']);
        exit;
    }

    $_SESSION['seller_id'] = (int)$row['id'];
    $_SESSION['seller_raffle_id'] = (int)$row['raffle_id'];
    $_SESSION['seller_last_activity'] = time();

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error del servidor']);
}
