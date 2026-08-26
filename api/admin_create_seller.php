<?php
require_once 'auth.php';
require_once 'db.php';
require_once 'slug_helper.php';
require_once 'seller_helper.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);
$raffle_id = isset($data['raffle_id']) ? (int)$data['raffle_id'] : 0;
$name = isset($data['name']) ? trim($data['name']) : '';
$phone = isset($data['phone']) && trim($data['phone']) !== '' ? trim($data['phone']) : null;
$email = isset($data['email']) && trim($data['email']) !== '' ? trim($data['email']) : null;
$rangeStart = isset($data['range_start']) ? (int)$data['range_start'] : -1;
$rangeEnd = isset($data['range_end']) ? (int)$data['range_end'] : -1;

if ($raffle_id <= 0 || $name === '') {
    echo json_encode(['success' => false, 'error' => 'Faltan datos requeridos']);
    exit;
}

if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Correo del vendedor inválido']);
    exit;
}

assert_raffle_ownership($pdo, $raffle_id);

try {
    $stmtRaffle = $pdo->prepare("SELECT total_tickets FROM raffles WHERE id = ?");
    $stmtRaffle->execute([$raffle_id]);
    $raffle = $stmtRaffle->fetch();

    $error = validate_seller_range($pdo, $raffle_id, (int)$raffle['total_tickets'], $rangeStart, $rangeEnd);
    if ($error) {
        echo json_encode(['success' => false, 'error' => $error]);
        exit;
    }

    $code = generate_seller_code($pdo);

    $stmt = $pdo->prepare("
        INSERT INTO sellers (raffle_id, code, name, phone, email, range_start, range_end)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$raffle_id, $code, $name, $phone, $email, $rangeStart, $rangeEnd]);

    echo json_encode(['success' => true, 'seller_id' => (int)$pdo->lastInsertId(), 'code' => $code]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al crear el vendedor']);
}
