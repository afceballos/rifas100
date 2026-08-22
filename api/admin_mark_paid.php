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

$allowed_statuses = ['reserved', 'reviewing', 'paid'];
if (!in_array($data['new_status'], $allowed_statuses)) {
    echo json_encode(['success' => false, 'error' => 'Estado inválido']);
    exit;
}

assert_raffle_ownership($pdo, (int)$data['raffle_id']);

try {
    // Permite cambiar entre 'reserved' (apartado), 'reviewing' (revisando) y 'paid' (validado)
    $stmt = $pdo->prepare("UPDATE tickets SET status = ? WHERE raffle_id = ? AND ticket_number = ? AND status != 'available'");
    $stmt->execute([$data['new_status'], $data['raffle_id'], $data['ticket_number']]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar']);
}
