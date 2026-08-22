<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);
$raffle_id = isset($data['raffle_id']) ? (int)$data['raffle_id'] : 0;
$ticketNumbers = is_array($data['ticket_numbers'] ?? null) ? array_map('intval', $data['ticket_numbers']) : [];

if ($raffle_id <= 0 || empty($ticketNumbers)) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

if (count($ticketNumbers) > 500) {
    echo json_encode(['success' => false, 'error' => 'No se pueden liberar más de 500 boletos a la vez.']);
    exit;
}

assert_raffle_ownership($pdo, $raffle_id);

try {
    $placeholders = implode(',', array_fill(0, count($ticketNumbers), '?'));
    $params = array_merge([$raffle_id], $ticketNumbers);

    $stmtImg = $pdo->prepare("
        SELECT receipt_image FROM tickets
        WHERE raffle_id = ? AND ticket_number IN ($placeholders) AND receipt_image IS NOT NULL
    ");
    $stmtImg->execute($params);
    $receipts = $stmtImg->fetchAll(PDO::FETCH_COLUMN);

    // Libera los boletos: borra datos del comprador (y notas/comprobante) y los devuelve a 'available'
    $stmt = $pdo->prepare("
        UPDATE tickets
        SET status = 'available', buyer_name = NULL, buyer_phone = NULL, buyer_email = NULL,
            ticket_code = NULL, receipt_image = NULL, admin_notes = NULL
        WHERE raffle_id = ? AND ticket_number IN ($placeholders) AND status != 'available'
    ");
    $stmt->execute($params);

    foreach ($receipts as $receiptPath) {
        $path = __DIR__ . '/../' . ltrim($receiptPath, '/');
        if (is_file($path)) {
            @unlink($path);
        }
    }

    echo json_encode(['success' => true, 'deleted' => $stmt->rowCount()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al liberar los boletos']);
}
