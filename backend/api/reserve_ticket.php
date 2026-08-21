<?php
header('Content-Type: application/json');
require_once '../db.php';

// Leer JSON entrante
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['raffle_id'], $data['ticket_number'], $data['buyer_name'], $data['buyer_phone'])) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios.']);
    exit;
}

$raffle_id = (int)$data['raffle_id'];
$ticket_number = (int)$data['ticket_number'];
$name = trim($data['buyer_name']);
$phone = trim($data['buyer_phone']);
$email = isset($data['buyer_email']) ? trim($data['buyer_email']) : null;

try {
    $pdo->beginTransaction();

    // Bloqueo pesimista para evitar race conditions
    $stmt = $pdo->prepare("SELECT status FROM tickets WHERE raffle_id = ? AND ticket_number = ? FOR UPDATE");
    $stmt->execute([$raffle_id, $ticket_number]);
    $ticket = $stmt->fetch();

    if ($ticket && $ticket['status'] !== 'available') {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'El boleto ya fue seleccionado.']);
        exit;
    }

    // Reservar el boleto
    $updateStmt = $pdo->prepare("
        UPDATE tickets 
        SET status = 'reserved', buyer_name = ?, buyer_phone = ?, buyer_email = ?
        WHERE raffle_id = ? AND ticket_number = ?
    ");
    $updateStmt->execute([$name, $phone, $email, $raffle_id, $ticket_number]);

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Boleto reservado exitosamente.']);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error del servidor.']);
}
