<?php
header('Content-Type: application/json');
require_once 'db.php';
require_once 'slug_helper.php';

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
$sellerCode = isset($data['seller_code']) && trim($data['seller_code']) !== '' ? strtoupper(trim($data['seller_code'])) : null;

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

    $sellerId = null;
    if ($sellerCode !== null) {
        $sellerStmt = $pdo->prepare("SELECT id FROM sellers WHERE raffle_id = ? AND code = ?");
        $sellerStmt->execute([$raffle_id, $sellerCode]);
        $sellerRow = $sellerStmt->fetch();
        $sellerId = $sellerRow ? (int)$sellerRow['id'] : null;
    }

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
        SET status = 'reserved', buyer_name = ?, buyer_phone = ?, buyer_email = ?, ticket_code = ?, seller_id = ?
        WHERE raffle_id = ? AND ticket_number = ?
    ");

    // Un solo código para toda la compra: todos los números reservados en esta
    // llamada comparten el mismo boleto digital (/ticket/:code).
    $code = generate_ticket_code($pdo);
    $tickets = [];
    foreach ($ticketNumbers as $num) {
        $updateStmt->execute([$name, $phone, $email, $code, $sellerId, $raffle_id, $num]);
        $tickets[] = ['number' => $num, 'code' => $code];
    }

    $pdo->commit();
    echo json_encode([
        'success' => true,
        'message' => 'Boletos reservados exitosamente.',
        'ticket_numbers' => $ticketNumbers,
        'tickets' => $tickets,
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error del servidor.']);
}
