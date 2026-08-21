<?php
header('Content-Type: application/json');
require_once 'db.php';

try {
    $stmt = $pdo->query("
        SELECT r.id, r.title, r.description, r.price_per_ticket, r.draw_date, r.digits, r.total_tickets, r.status, r.created_at,
               (SELECT COUNT(*) FROM tickets t WHERE t.raffle_id = r.id AND t.status = 'paid') AS tickets_paid,
               (SELECT COUNT(*) FROM tickets t WHERE t.raffle_id = r.id AND t.status = 'reserved') AS tickets_reserved
        FROM raffles r
        ORDER BY r.created_at DESC
    ");
    $raffles = $stmt->fetchAll();

    echo json_encode(['success' => true, 'raffles' => $raffles]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al cargar rifas']);
}
