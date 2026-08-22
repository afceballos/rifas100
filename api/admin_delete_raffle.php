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
    $stmtImg = $pdo->prepare("SELECT background_image FROM raffles WHERE id = ?");
    $stmtImg->execute([$raffle_id]);
    $row = $stmtImg->fetch();

    // ON DELETE CASCADE en tickets elimina los boletos automáticamente
    $stmt = $pdo->prepare("DELETE FROM raffles WHERE id = ?");
    $stmt->execute([$raffle_id]);

    if ($row && $row['background_image']) {
        $path = __DIR__ . '/../' . ltrim($row['background_image'], '/');
        if (is_file($path)) {
            @unlink($path);
        }
    }

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al eliminar la rifa']);
}
