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

assert_raffle_ownership($pdo, $raffle_id);

try {
    $stmtImg = $pdo->prepare("SELECT receipt_image FROM tickets WHERE raffle_id = ? AND ticket_number = ?");
    $stmtImg->execute([$raffle_id, $ticket_number]);
    $row = $stmtImg->fetch();

    // Libera el boleto: borra datos del comprador (y notas/comprobante) y lo devuelve a 'available'
    $stmt = $pdo->prepare("
        UPDATE tickets
        SET status = 'available', buyer_name = NULL, buyer_phone = NULL, buyer_email = NULL,
            ticket_code = NULL, receipt_image = NULL, admin_notes = NULL
        WHERE raffle_id = ? AND ticket_number = ? AND status != 'available'
    ");
    $stmt->execute([$raffle_id, $ticket_number]);

    if ($stmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'error' => 'Boleto no encontrado o ya disponible']);
        exit;
    }

    if ($row && $row['receipt_image']) {
        $path = __DIR__ . '/../' . ltrim($row['receipt_image'], '/');
        if (is_file($path)) {
            @unlink($path);
        }
    }

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al liberar el boleto']);
}
