<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);
$raffle_id = isset($data['raffle_id']) ? (int)$data['raffle_id'] : 0;
$seller_id = isset($data['seller_id']) ? (int)$data['seller_id'] : 0;

if ($raffle_id <= 0 || $seller_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

assert_raffle_ownership($pdo, $raffle_id);

try {
    // Los boletos ya vendidos por este vendedor no se ven afectados;
    // ON DELETE SET NULL en tickets.seller_id solo quita la atribución.
    $stmt = $pdo->prepare("DELETE FROM sellers WHERE id = ? AND raffle_id = ?");
    $stmt->execute([$seller_id, $raffle_id]);

    if ($stmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'error' => 'Vendedor no encontrado']);
        exit;
    }

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al eliminar el vendedor']);
}
