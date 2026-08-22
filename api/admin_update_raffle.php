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
$organizerName = isset($data['organizer_name']) && $data['organizer_name'] !== '' ? trim($data['organizer_name']) : null;

function remove_raffle_photo($pdo, $raffle_id, $column) {
    $stmt = $pdo->prepare("SELECT $column FROM raffles WHERE id = ?");
    $stmt->execute([$raffle_id]);
    $row = $stmt->fetch();
    if ($row && $row[$column]) {
        $path = __DIR__ . '/../' . ltrim($row[$column], '/');
        if (is_file($path)) {
            @unlink($path);
        }
    }
    $stmt2 = $pdo->prepare("UPDATE raffles SET $column = NULL WHERE id = ?");
    $stmt2->execute([$raffle_id]);
}

try {
    $stmt = $pdo->prepare("UPDATE raffles SET title = ?, price_per_ticket = ?, draw_date = ?, description = ?, organizer_name = ? WHERE id = ?");
    $stmt->execute([$data['title'], $data['price_per_ticket'], $data['draw_date'], $description, $organizerName, $raffle_id]);

    if (!empty($data['remove_image'])) {
        remove_raffle_photo($pdo, $raffle_id, 'background_image');
    }

    if (!empty($data['remove_organizer_photo'])) {
        remove_raffle_photo($pdo, $raffle_id, 'organizer_photo');
    }

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar el sorteo']);
}
