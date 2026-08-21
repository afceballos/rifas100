<?php
header('Content-Type: application/json');
require_once 'db.php';

// Leer JSON entrante
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['raffle_id'], $data['ticket_numbers'], $data['buyer_name'], $data['buyer_phone'])) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios.']);
    exit;
}

$raffle_id = (int)$data['raffle_id'];
$ticketNumbers = is_array($data['ticket_numbers']) ? $data['ticket_numbers'] : [];
$ticketNumbers = array_values(array_unique(array_map('intval', $ticketNumbers)));
sort($ticketNumbers); // orden ascendente: evita deadlocks entre reservas múltiples concurrentes

$name = trim($data['buyer_name']);
$phone = trim($data['buyer_phone']);
$email = isset($data['buyer_email']) ? trim($data['buyer_email']) : null;

if (empty($ticketNumbers) || $name === '' || $phone === '') {
    echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios.']);
    exit;
}

if (count($ticketNumbers) > 500) {
    echo json_encode(['success' => false, 'message' => 'No se pueden reservar más de 500 boletos a la vez.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Bloqueo pesimista de cada boleto para evitar race conditions
    $unavailable = [];
    $checkStmt = $pdo->prepare("SELECT status FROM tickets WHERE raffle_id = ? AND ticket_number = ? FOR UPDATE");
    foreach ($ticketNumbers as $num) {
        $checkStmt->execute([$raffle_id, $num]);
        $ticket = $checkStmt->fetch();
        if (!$ticket || $ticket['status'] !== 'available') {
            $unavailable[] = $num;
        }
    }

    if (!empty($unavailable)) {
        $pdo->rollBack();
        echo json_encode([
            'success' => false,
            'message' => 'Uno o más boletos ya no están disponibles.',
            'unavailable' => $unavailable,
        ]);
        exit;
    }

    $updateStmt = $pdo->prepare("
        UPDATE tickets
        SET status = 'reserved', buyer_name = ?, buyer_phone = ?, buyer_email = ?
        WHERE raffle_id = ? AND ticket_number = ?
    ");
    foreach ($ticketNumbers as $num) {
        $updateStmt->execute([$name, $phone, $email, $raffle_id, $num]);
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Boletos reservados exitosamente.', 'ticket_numbers' => $ticketNumbers]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error del servidor.']);
}
