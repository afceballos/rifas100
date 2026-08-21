<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);
$raffle_id = isset($data['raffle_id']) ? (int)$data['raffle_id'] : 0;

if ($raffle_id <= 0 || empty($data['title']) || empty($data['price_per_ticket']) || empty($data['draw_date'])) {
    echo json_encode(['success' => false, 'error' => 'Faltan datos requeridos']);
    exit;
}

$description = isset($data['description']) && $data['description'] !== '' ? $data['description'] : null;

try {
    $stmt = $pdo->prepare("UPDATE raffles SET title = ?, price_per_ticket = ?, draw_date = ?, description = ? WHERE id = ?");
    $stmt->execute([$data['title'], $data['price_per_ticket'], $data['draw_date'], $description, $raffle_id]);

    if (!empty($data['remove_image'])) {
        $stmt2 = $pdo->prepare("SELECT background_image FROM raffles WHERE id = ?");
        $stmt2->execute([$raffle_id]);
        $row = $stmt2->fetch();
        if ($row && $row['background_image']) {
            $path = __DIR__ . '/../' . ltrim($row['background_image'], '/');
            if (is_file($path)) {
                @unlink($path);
            }
        }
        $stmt3 = $pdo->prepare("UPDATE raffles SET background_image = NULL WHERE id = ?");
        $stmt3->execute([$raffle_id]);
    }

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar el sorteo']);
}
