<?php
require_once 'auth.php';
require_once 'db.php';
require_once 'seller_helper.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);
$raffle_id = isset($data['raffle_id']) ? (int)$data['raffle_id'] : 0;
$seller_id = isset($data['seller_id']) ? (int)$data['seller_id'] : 0;
$name = isset($data['name']) ? trim($data['name']) : '';
$phone = isset($data['phone']) && trim($data['phone']) !== '' ? trim($data['phone']) : null;
$email = isset($data['email']) && trim($data['email']) !== '' ? trim($data['email']) : null;
$rangeStart = isset($data['range_start']) && $data['range_start'] !== '' && $data['range_start'] !== null ? (int)$data['range_start'] : null;
$rangeEnd = isset($data['range_end']) && $data['range_end'] !== '' && $data['range_end'] !== null ? (int)$data['range_end'] : null;

if ($raffle_id <= 0 || $seller_id <= 0 || $name === '') {
    echo json_encode(['success' => false, 'error' => 'Faltan datos requeridos']);
    exit;
}

if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Correo del vendedor inválido']);
    exit;
}

assert_raffle_ownership($pdo, $raffle_id);

try {
    $stmtOwner = $pdo->prepare("SELECT id FROM sellers WHERE id = ? AND raffle_id = ?");
    $stmtOwner->execute([$seller_id, $raffle_id]);
    if (!$stmtOwner->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Vendedor no encontrado']);
        exit;
    }

    $stmtRaffle = $pdo->prepare("SELECT total_tickets, number_start FROM raffles WHERE id = ?");
    $stmtRaffle->execute([$raffle_id]);
    $raffle = $stmtRaffle->fetch();

    $error = validate_seller_range($pdo, $raffle_id, (int)$raffle['total_tickets'], $rangeStart, $rangeEnd, $seller_id, (int)$raffle['number_start']);
    if ($error) {
        echo json_encode(['success' => false, 'error' => $error]);
        exit;
    }

    $stmt = $pdo->prepare("
        UPDATE sellers SET name = ?, phone = ?, email = ?, range_start = ?, range_end = ?
        WHERE id = ? AND raffle_id = ?
    ");
    $stmt->execute([$name, $phone, $email, $rangeStart, $rangeEnd, $seller_id, $raffle_id]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar el vendedor']);
}
