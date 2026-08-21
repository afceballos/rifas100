<?php
header('Content-Type: application/json');
require_once 'db.php';
require_once 'auth.php';

require_auth();
$data = json_decode(file_get_contents('php://input'), true);
$new_status    = $data['new_status'] ?? '';
$raffle_id     = (int)($data['raffle_id'] ?? 0);
$ticket_number = (int)($data['ticket_number'] ?? 0);


if (!isset($data['raffle_id'], $data['ticket_number'])) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos']);
    exit;
}

try {

    if (!in_array($new_status, ['reserved', 'paid'], true)) {
        echo json_encode(['success' => false, 'error' => 'Estado inválido']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE tickets SET status = ? WHERE raffle_id = ? AND ticket_number = ? AND status IN ('reserved', 'paid')");
    $stmt->execute([$new_status, $raffle_id, $ticket_number]);
    

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar']);
}
