<?php
header('Content-Type: application/json');
require_once 'db.php';
require_once 'auth.php';

require_auth();

$data = json_decode(file_get_contents('php://input'), true);
$new_status    = $data['new_status'] ?? '';
$raffle_id     = (int)($data['raffle_id'] ?? 0);
$ticket_number = (int)($data['ticket_number'] ?? 0);

if (!in_array($new_status, ['paid', 'reserved']) || $raffle_id <= 0 || $ticket_number < 0) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

try {
    // Permite cambiar entre 'paid' (pagado) y 'reserved' (no pagado/pendiente)
    $stmt = $pdo->prepare("UPDATE tickets SET status = ? WHERE raffle_id = ? AND ticket_number = ? AND status != 'available'");
    $stmt->execute([$new_status, $raffle_id, $ticket_number]);

    if ($stmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'error' => 'No se encontró el boleto o ya está disponible']);
        exit;
    }

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar']);
}
