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

try {
    // Alterna entre publicado (1) y despublicado (0)
    $stmt = $pdo->prepare("UPDATE raffles SET is_published = NOT is_published WHERE id = ?");
    $stmt->execute([$raffle_id]);

    $stmt2 = $pdo->prepare("SELECT is_published FROM raffles WHERE id = ?");
    $stmt2->execute([$raffle_id]);
    $row = $stmt2->fetch();

    echo json_encode(['success' => true, 'is_published' => (bool)$row['is_published']]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al cambiar estado']);
}
