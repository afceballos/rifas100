<?php
header('Content-Type: application/json');


if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

require_once 'db.php';
$data = json_decode(file_get_contents('php://input'), true);
$new_status    = $data['new_status'] ?? '';
$raffle_id     = (int)($data['raffle_id'] ?? 0);
$ticket_number = (int)($data['ticket_number'] ?? 0);


if (!isset($data['ticket_number'])) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos']);
    exit;
}

try {

    $stmt = $pdo->prepare("UPDATE tickets SET status = 'paid' WHERE ticket_number = ? AND status = 'reserved'");
    $stmt->execute([$data['ticket_number']]);
    

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar']);
}
