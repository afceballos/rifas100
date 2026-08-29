<?php
require_once 'seller_auth.php';
require_once 'db.php';
require_once 'seller_helper.php';
header('Content-Type: application/json');

require_seller_auth($pdo);

try {
    $stmt = $pdo->prepare("
        SELECT s.id, s.code, s.name, s.phone, s.email, s.range_start, s.range_end,
               r.id AS raffle_id, r.slug, r.title, r.total_tickets, r.price_per_ticket
        FROM sellers s
        JOIN raffles r ON r.id = s.raffle_id
        WHERE s.id = ?
    ");
    $stmt->execute([current_seller_id()]);
    $seller = $stmt->fetch();

    if (!$seller) {
        echo json_encode(['success' => false, 'error' => 'Vendedor no encontrado']);
        exit;
    }

    $seller['numbers'] = get_seller_numbers($pdo, (int)$seller['id']);

    echo json_encode(['success' => true, 'seller' => $seller]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al obtener los datos']);
}
