<?php
require_once 'db.php';
require_once 'image_helper.php';
header('Content-Type: application/json');

// Endpoint público: el comprador sube su propio comprobante desde la página
// del boleto. No hay sesión — el ticket_code (secreto que solo el comprador
// tiene, igual que en get_ticket.php) identifica la compra. La rifa debe
// tener receipt_upload_enabled = 1, revisado aquí, no solo ocultado en el UI.

$ticket_code = isset($_POST['ticket_code']) ? trim($_POST['ticket_code']) : '';

if ($ticket_code === '') {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT t.raffle_id, t.receipt_image, r.receipt_upload_enabled
        FROM tickets t
        JOIN raffles r ON r.id = t.raffle_id
        WHERE t.ticket_code = ?
        LIMIT 1
    ");
    $stmt->execute([$ticket_code]);
    $row = $stmt->fetch();

    if (!$row) {
        echo json_encode(['success' => false, 'error' => 'Boleto no encontrado']);
        exit;
    }
    if ((int)$row['receipt_upload_enabled'] !== 1) {
        echo json_encode(['success' => false, 'error' => 'La subida de comprobantes no está habilitada para esta rifa']);
        exit;
    }

    $raffle_id = (int)$row['raffle_id'];

    $result = process_image_upload($_FILES['image'] ?? null, __DIR__ . '/../uploads/receipts', 'receipt_' . $raffle_id . '_' . preg_replace('/[^a-zA-Z0-9]/', '', $ticket_code));
    if (!$result['success']) {
        echo json_encode($result);
        exit;
    }

    $publicPath = '/uploads/receipts/' . $result['filename'];

    // Aplica a todos los números de la compra (comparten ticket_code); si estaba
    // "reservado" pasa a "en revisión" para que el admin sepa que hay que mirarlo.
    $stmt2 = $pdo->prepare("
        UPDATE tickets
        SET receipt_image = ?, status = CASE WHEN status = 'reserved' THEN 'reviewing' ELSE status END
        WHERE raffle_id = ? AND ticket_code = ?
    ");
    $stmt2->execute([$publicPath, $raffle_id, $ticket_code]);

    if ($row['receipt_image'] && $row['receipt_image'] !== $publicPath) {
        $oldPath = __DIR__ . '/../' . ltrim($row['receipt_image'], '/');
        if (is_file($oldPath)) {
            @unlink($oldPath);
        }
    }

    echo json_encode(['success' => true, 'receipt_image' => $publicPath]);
} catch (Exception $e) {
    if (isset($result['path'])) @unlink($result['path']);
    echo json_encode(['success' => false, 'error' => 'Error al guardar el comprobante']);
}
