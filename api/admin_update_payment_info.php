<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);
$raffle_id = isset($data['raffle_id']) ? (int)$data['raffle_id'] : 0;
$methods = isset($data['payment_methods']) && is_array($data['payment_methods']) ? $data['payment_methods'] : [];

if ($raffle_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

$clean = [];
foreach ($methods as $entry) {
    if (!is_array($entry)) continue;

    $method = isset($entry['method']) ? trim($entry['method']) : '';
    if ($method === '') continue;

    $institution = isset($entry['institution']) ? trim($entry['institution']) : '';
    $description = isset($entry['description']) ? trim($entry['description']) : '';

    $details = [];
    if (isset($entry['details']) && is_array($entry['details'])) {
        foreach ($entry['details'] as $row) {
            $type = isset($row['type']) ? trim($row['type']) : '';
            $value = isset($row['value']) ? trim($row['value']) : '';
            if ($value !== '') {
                $details[] = ['type' => $type !== '' ? $type : 'Otro', 'value' => $value];
            }
        }
    }

    $clean[] = [
        'method' => $method,
        'institution' => $institution,
        'details' => $details,
        'description' => $description,
    ];
}

try {
    $stmt = $pdo->prepare("UPDATE raffles SET payment_info = ? WHERE id = ?");
    $stmt->execute([json_encode($clean, JSON_UNESCAPED_UNICODE), $raffle_id]);

    echo json_encode(['success' => true, 'payment_methods' => $clean]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al guardar los métodos de pago']);
}
