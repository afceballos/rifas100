<?php
header('Content-Type: application/json');
require_once 'db.php';

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

    // Verificar que la rifa esté publicada
    $stmt = $pdo->prepare("SELECT status FROM raffles WHERE id = ? AND deleted_at IS NULL FOR UPDATE");
    $stmt->execute([$raffle_id]);
    $raffle = $stmt->fetch();
    if (!$raffle) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'La rifa no existe.']);
        exit;
    }
    if ($raffle['status'] !== 'published') {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'La rifa no está disponible para reservas.']);
        exit;
    }

    // Bloqueo pesimista para evitar race conditions
    $stmt = $pdo->prepare("SELECT status FROM tickets WHERE raffle_id = ? AND ticket_number = ? FOR UPDATE");
    $stmt->execute([$raffle_id, $ticket_number]);
    $ticket = $stmt->fetch();

    if (!$ticket) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'El boleto no existe.']);
        exit;
    }
    if ($ticket['status'] !== 'available') {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'El boleto ya fue seleccionado.']);
        exit;
    }

    $updateStmt = $pdo->prepare("
        UPDATE tickets
        SET status = 'reserved', buyer_name = ?, buyer_phone = ?, buyer_email = ?
        WHERE raffle_id = ? AND ticket_number = ?
    ");
    $updateStmt->execute([$name, $phone, $email, $raffle_id, $ticket_number]);

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Boleto reservado exitosamente.']);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error del servidor.']);
}
