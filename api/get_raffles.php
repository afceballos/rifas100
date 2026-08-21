<?php
header('Content-Type: application/json');
require_once 'db.php';

try {
    $stmt = $pdo->query("SELECT id, title, description, price_per_ticket, draw_date, digits, total_tickets FROM raffles WHERE status = 'published' ORDER BY draw_date ASC");
    echo json_encode(['success' => true, 'raffles' => $stmt->fetchAll()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'No se pudieron cargar las rifas']);
}
