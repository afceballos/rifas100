<?php
session_start();
header('Content-Type: application/json');
require_once 'db.php';
require_once 'auth.php';

require_auth();

try {
    $stmt = $pdo->query("
        SELECT r.id, r.title, r.price_per_ticket, r.draw_date, r.total_tickets, r.status, r.created_at,
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
