<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);
$raffle_id = isset($data['raffle_id']) ? (int)$data['raffle_id'] : 0;

if ($raffle_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'ID inválido']);
    exit;
}

assert_raffle_ownership($pdo, $raffle_id);

$allowSellerSelection = !empty($data['allow_seller_selection']) ? 1 : 0;

try {
    $stmt = $pdo->prepare("UPDATE raffles SET allow_seller_selection = ? WHERE id = ?");
    $stmt->execute([$allowSellerSelection, $raffle_id]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al guardar el ajuste']);
}
