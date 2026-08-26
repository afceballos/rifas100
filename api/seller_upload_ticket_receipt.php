<?php
require_once 'seller_auth.php';
require_once 'db.php';
require_once 'image_helper.php';
header('Content-Type: application/json');

require_seller_auth($pdo);

$ticket_code = isset($_POST['ticket_code']) ? trim($_POST['ticket_code']) : '';

if ($ticket_code === '') {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

$raffle_id = current_seller_raffle_id();
$seller_id = current_seller_id();

$stmtCheck = $pdo->prepare("SELECT receipt_image FROM tickets WHERE raffle_id = ? AND ticket_code = ? AND seller_id = ? LIMIT 1");
$stmtCheck->execute([$raffle_id, $ticket_code, $seller_id]);
$row = $stmtCheck->fetch();

if (!$row) {
    echo json_encode(['success' => false, 'error' => 'No se encontró ese boleto entre tus ventas']);
    exit;
}

$result = process_image_upload($_FILES['image'] ?? null, __DIR__ . '/../uploads/receipts', 'receipt_' . $raffle_id . '_' . preg_replace('/[^a-zA-Z0-9]/', '', $ticket_code));
if (!$result['success']) {
    echo json_encode($result);
    exit;
}

$publicPath = '/uploads/receipts/' . $result['filename'];

try {
    // Se aplica a todos los números de la compra (comparten ticket_code).
    $stmt2 = $pdo->prepare("UPDATE tickets SET receipt_image = ? WHERE raffle_id = ? AND ticket_code = ? AND seller_id = ?");
    $stmt2->execute([$publicPath, $raffle_id, $ticket_code, $seller_id]);

    if ($row['receipt_image'] && $row['receipt_image'] !== $publicPath) {
        $oldPath = __DIR__ . '/../' . ltrim($row['receipt_image'], '/');
        if (is_file($oldPath)) {
            @unlink($oldPath);
        }
    }

    echo json_encode(['success' => true, 'receipt_image' => $publicPath]);
} catch (Exception $e) {
    @unlink($result['path']);
    echo json_encode(['success' => false, 'error' => 'Error al guardar el comprobante']);
}
