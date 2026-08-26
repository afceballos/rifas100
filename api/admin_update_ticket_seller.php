<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);
$raffle_id = isset($data['raffle_id']) ? (int)$data['raffle_id'] : 0;
$ticket_code = isset($data['ticket_code']) ? trim($data['ticket_code']) : '';
$seller_id = isset($data['seller_id']) && $data['seller_id'] !== '' && $data['seller_id'] !== null ? (int)$data['seller_id'] : null;

if ($raffle_id <= 0 || $ticket_code === '') {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

assert_raffle_ownership($pdo, $raffle_id);

try {
    if ($seller_id !== null) {
        $stmtSeller = $pdo->prepare("SELECT id FROM sellers WHERE id = ? AND raffle_id = ?");
        $stmtSeller->execute([$seller_id, $raffle_id]);
        if (!$stmtSeller->fetch()) {
            echo json_encode(['success' => false, 'error' => 'Vendedor no encontrado']);
            exit;
        }
    }

    $stmtTicket = $pdo->prepare("SELECT id FROM tickets WHERE raffle_id = ? AND ticket_code = ? LIMIT 1");
    $stmtTicket->execute([$raffle_id, $ticket_code]);
    if (!$stmtTicket->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Boleto no encontrado']);
        exit;
    }

    // Se aplica a todos los números de la compra (comparten ticket_code).
    $stmt = $pdo->prepare("UPDATE tickets SET seller_id = ? WHERE raffle_id = ? AND ticket_code = ?");
    $stmt->execute([$seller_id, $raffle_id, $ticket_code]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar el vendedor']);
}
