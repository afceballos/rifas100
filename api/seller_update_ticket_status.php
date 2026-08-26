<?php
require_once 'seller_auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_seller_auth($pdo);

$data = json_decode(file_get_contents('php://input'), true);
$ticket_number = isset($data['ticket_number']) ? (int)$data['ticket_number'] : -1;
$new_status = $data['new_status'] ?? '';

// Un vendedor nunca puede liberar un boleto (volverlo 'available'); eso
// queda exclusivo del admin.
$allowed_statuses = ['reserved', 'reviewing', 'paid'];
if ($ticket_number < 0 || !in_array($new_status, $allowed_statuses, true)) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

try {
    $raffle_id = current_seller_raffle_id();
    $seller_id = current_seller_id();

    $stmtCheck = $pdo->prepare("SELECT status FROM tickets WHERE raffle_id = ? AND ticket_number = ? AND seller_id = ?");
    $stmtCheck->execute([$raffle_id, $ticket_number, $seller_id]);
    $row = $stmtCheck->fetch();

    if (!$row) {
        echo json_encode(['success' => false, 'error' => 'No se encontró ese boleto entre tus ventas']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE tickets SET status = ? WHERE raffle_id = ? AND ticket_number = ? AND seller_id = ?");
    $stmt->execute([$new_status, $raffle_id, $ticket_number, $seller_id]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar el estado']);
}
