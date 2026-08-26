<?php
require_once 'seller_auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_seller_auth($pdo);

$data = json_decode(file_get_contents('php://input'), true);
$ticketNumbers = is_array($data['ticket_numbers'] ?? null) ? array_map('intval', $data['ticket_numbers']) : [];
$new_status = $data['new_status'] ?? '';

// Un vendedor nunca puede liberar un boleto (volverlo 'available'); eso
// queda exclusivo del admin.
$allowed_statuses = ['reserved', 'reviewing', 'paid'];
if (empty($ticketNumbers) || !in_array($new_status, $allowed_statuses, true)) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

try {
    $raffle_id = current_seller_raffle_id();
    $seller_id = current_seller_id();

    $placeholders = implode(',', array_fill(0, count($ticketNumbers), '?'));
    $countStmt = $pdo->prepare("
        SELECT COUNT(*) FROM tickets
        WHERE raffle_id = ? AND seller_id = ? AND ticket_number IN ($placeholders)
    ");
    $countStmt->execute(array_merge([$raffle_id, $seller_id], $ticketNumbers));
    if ((int)$countStmt->fetchColumn() !== count($ticketNumbers)) {
        echo json_encode(['success' => false, 'error' => 'No se encontraron esos boletos entre tus ventas']);
        exit;
    }

    $stmt = $pdo->prepare("
        UPDATE tickets SET status = ?
        WHERE raffle_id = ? AND seller_id = ? AND ticket_number IN ($placeholders)
    ");
    $stmt->execute(array_merge([$new_status, $raffle_id, $seller_id], $ticketNumbers));

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar el estado']);
}
