<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);
$raffle_id     = isset($data['raffle_id'])     ? (int)$data['raffle_id']     : 0;
$ticket_number = isset($data['ticket_number']) ? (int)$data['ticket_number'] : -1;

if ($raffle_id <= 0 || $ticket_number < 0) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

try {
    // Libera el boleto: borra datos del comprador y lo devuelve a 'available'
    $stmt = $pdo->prepare("
        UPDATE tickets
        SET status = 'available', buyer_name = NULL, buyer_phone = NULL, buyer_email = NULL
        WHERE raffle_id = ? AND ticket_number = ? AND status != 'available'
    ");
    $stmt->execute([$raffle_id, $ticket_number]);

    if ($stmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'error' => 'Boleto no encontrado o ya disponible']);
        exit;
    }

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al liberar el boleto']);
}
