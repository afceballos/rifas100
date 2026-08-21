<?php
header('Content-Type: application/json');
require_once 'db.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

try {
    $stmt = $pdo->prepare("SELECT id, title, price_per_ticket, draw_date, total_tickets FROM raffles WHERE id = ?");
    $stmt->execute([$id]);
    $raffle = $stmt->fetch();

    if (!$raffle) {
        echo json_encode(['success' => false, 'error' => 'Rifa no encontrada.']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT ticket_number as number, status FROM tickets WHERE raffle_id = ? ORDER BY ticket_number ASC");
    $stmt->execute([$id]);
    $tickets = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'raffle' => $raffle,
        'tickets' => $tickets
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error de base de datos']);
}
