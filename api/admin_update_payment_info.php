<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);
$raffle_id = isset($data['raffle_id']) ? (int)$data['raffle_id'] : 0;
$payment = isset($data['payment_info']) && is_array($data['payment_info']) ? $data['payment_info'] : null;

if ($raffle_id <= 0 || !$payment) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

$method = isset($payment['method']) ? trim($payment['method']) : '';
$institution = isset($payment['institution']) ? trim($payment['institution']) : '';
$description = isset($payment['description']) ? trim($payment['description']) : '';

$details = [];
if (isset($payment['details']) && is_array($payment['details'])) {
    foreach ($payment['details'] as $row) {
        $type = isset($row['type']) ? trim($row['type']) : '';
        $value = isset($row['value']) ? trim($row['value']) : '';
        if ($value !== '') {
            $details[] = ['type' => $type !== '' ? $type : 'Otro', 'value' => $value];
        }
    }
}

if ($method === '') {
    echo json_encode(['success' => false, 'error' => 'El método de pago es requerido']);
    exit;
}

$clean = [
    'method' => $method,
    'institution' => $institution,
    'details' => $details,
    'description' => $description,
];

try {
    $stmt = $pdo->prepare("UPDATE raffles SET payment_info = ? WHERE id = ?");
    $stmt->execute([json_encode($clean, JSON_UNESCAPED_UNICODE), $raffle_id]);

    echo json_encode(['success' => true, 'payment_info' => $clean]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al guardar el método de pago']);
}
