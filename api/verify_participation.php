<?php
header('Content-Type: application/json');
require_once 'db.php';

$raffle_id = isset($_GET['raffle_id']) ? (int)$_GET['raffle_id'] : 0;
$ticket_number = isset($_GET['ticket_number']) ? (int)$_GET['ticket_number'] : -1;

if ($raffle_id <= 0 || $ticket_number < 0) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, status, buyer_name, buyer_phone, updated_at FROM tickets WHERE raffle_id = ? AND ticket_number = ?");
    $stmt->execute([$raffle_id, $ticket_number]);
    $ticket = $stmt->fetch();

    if (!$ticket || $ticket['status'] === 'available') {
        echo json_encode(['success' => true, 'found' => false]);
        exit;
    }

    // Enmascarar teléfono: solo se muestran los últimos 3 dígitos
    $phone = (string)$ticket['buyer_phone'];
    $maskedPhone = strlen($phone) > 3
        ? str_repeat('•', strlen($phone) - 3) . substr($phone, -3)
        : $phone;

    // Código de referencia enmascarado (no tiene uso funcional más allá de mostrarse)
    $code = strtoupper(substr(md5($raffle_id . '|' . $ticket_number . '|' . $ticket['id']), 0, 10));
    $maskedCode = str_repeat('•', max(0, strlen($code) - 4)) . substr($code, -4);

    echo json_encode([
        'success' => true,
        'found' => true,
        'buyer_name' => $ticket['buyer_name'],
        'buyer_phone' => $maskedPhone,
        'ticket_number' => $ticket_number,
        'status' => $ticket['status'] === 'paid' ? 'PAGADO' : 'APARTADO',
        'updated_at' => $ticket['updated_at'],
        'code' => $maskedCode,
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error de base de datos']);
}
