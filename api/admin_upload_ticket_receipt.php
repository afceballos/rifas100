<?php
require_once 'auth.php';
require_once 'db.php';
require_once 'image_helper.php';
header('Content-Type: application/json');

require_auth();

$raffle_id = isset($_POST['raffle_id']) ? (int)$_POST['raffle_id'] : 0;
$ticket_number = isset($_POST['ticket_number']) ? (int)$_POST['ticket_number'] : -1;

if ($raffle_id <= 0 || $ticket_number < 0) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

$result = process_image_upload($_FILES['image'] ?? null, __DIR__ . '/../uploads/receipts', 'receipt_' . $raffle_id . '_' . $ticket_number);
if (!$result['success']) {
    echo json_encode($result);
    exit;
}

$publicPath = '/uploads/receipts/' . $result['filename'];

try {
    $stmt = $pdo->prepare("SELECT receipt_image FROM tickets WHERE raffle_id = ? AND ticket_number = ?");
    $stmt->execute([$raffle_id, $ticket_number]);
    $row = $stmt->fetch();

    $stmt2 = $pdo->prepare("UPDATE tickets SET receipt_image = ? WHERE raffle_id = ? AND ticket_number = ?");
    $stmt2->execute([$publicPath, $raffle_id, $ticket_number]);

    if ($row && $row['receipt_image'] && $row['receipt_image'] !== $publicPath) {
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
