<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);
$raffle_id = isset($data['raffle_id']) ? (int)$data['raffle_id'] : 0;
$ticketNumbers = is_array($data['ticket_numbers'] ?? null) ? array_map('intval', $data['ticket_numbers']) : [];
$newStatus = $data['new_status'] ?? '';

$allowed_statuses = ['reserved', 'reviewing', 'paid'];
if ($raffle_id <= 0 || empty($ticketNumbers) || !in_array($newStatus, $allowed_statuses, true)) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

if (count($ticketNumbers) > 500) {
    echo json_encode(['success' => false, 'error' => 'No se pueden actualizar más de 500 boletos a la vez.']);
    exit;
}

assert_raffle_ownership($pdo, $raffle_id);

try {
    $placeholders = implode(',', array_fill(0, count($ticketNumbers), '?'));
    $params = array_merge([$newStatus, $raffle_id], $ticketNumbers);

    $stmt = $pdo->prepare("
        UPDATE tickets
        SET status = ?
        WHERE raffle_id = ? AND ticket_number IN ($placeholders) AND status != 'available'
    ");
    $stmt->execute($params);

    echo json_encode(['success' => true, 'updated' => $stmt->rowCount()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar los boletos']);
}
