<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);
$raffle_id = isset($data['raffle_id']) ? (int)$data['raffle_id'] : 0;
$ticket_code = isset($data['ticket_code']) ? trim($data['ticket_code']) : '';
$notes = isset($data['admin_notes']) ? trim($data['admin_notes']) : '';

if ($raffle_id <= 0 || $ticket_code === '') {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

assert_raffle_ownership($pdo, $raffle_id);

try {
    // Se aplica a todos los números de la compra (comparten ticket_code).
    $stmt = $pdo->prepare("UPDATE tickets SET admin_notes = ? WHERE raffle_id = ? AND ticket_code = ?");
    $stmt->execute([$notes !== '' ? $notes : null, $raffle_id, $ticket_code]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al guardar la nota']);
}
