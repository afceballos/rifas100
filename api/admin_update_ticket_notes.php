<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);
$raffle_id = isset($data['raffle_id']) ? (int)$data['raffle_id'] : 0;
$ticket_number = isset($data['ticket_number']) ? (int)$data['ticket_number'] : -1;
$notes = isset($data['admin_notes']) ? trim($data['admin_notes']) : '';

if ($raffle_id <= 0 || $ticket_number < 0) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

assert_raffle_ownership($pdo, $raffle_id);

try {
    $stmt = $pdo->prepare("UPDATE tickets SET admin_notes = ? WHERE raffle_id = ? AND ticket_number = ?");
    $stmt->execute([$notes !== '' ? $notes : null, $raffle_id, $ticket_number]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al guardar la nota']);
}
