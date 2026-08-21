<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['raffle_id'], $data['ticket_number'], $data['new_status'])) {
    echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
    exit;
}

$allowed_statuses = ['paid', 'reserved'];
if (!in_array($data['new_status'], $allowed_statuses)) {
    echo json_encode(['success' => false, 'error' => 'Estado inválido']);
    exit;
}

try {
    // Permite cambiar entre 'paid' (pagado) y 'reserved' (no pagado/pendiente)
    $stmt = $pdo->prepare("UPDATE tickets SET status = ? WHERE raffle_id = ? AND ticket_number = ? AND status != 'available'");
    $stmt->execute([$data['new_status'], $data['raffle_id'], $data['ticket_number']]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar']);
}
