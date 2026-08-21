<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

try {
    $stmt = $pdo->prepare("
        SELECT 
            r.id,
            r.title,
            r.price_per_ticket,
            r.draw_date,
            r.total_tickets,
            r.is_published,
            r.created_at,
            COUNT(CASE WHEN t.status = 'reserved' THEN 1 END) AS reserved_count,
            COUNT(CASE WHEN t.status = 'paid' THEN 1 END) AS paid_count
        FROM raffles r
        LEFT JOIN tickets t ON t.raffle_id = r.id
        GROUP BY r.id
        ORDER BY r.created_at DESC
    ");
    $stmt->execute();
    $raffles = $stmt->fetchAll();

    echo json_encode(['success' => true, 'raffles' => $raffles]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al cargar rifas']);
}
