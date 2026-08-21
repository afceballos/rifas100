<?php
header('Content-Type: application/json');
require_once 'db.php';

try {
    // Estadísticas
    $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM tickets GROUP BY status");
    $rawStats = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $stats = [
        'available' => $rawStats['available'] ?? 0,
        'reserved' => $rawStats['reserved'] ?? 0,
        'paid' => $rawStats['paid'] ?? 0
    ];

    // Dinero total (solo boletos pagados)
    $stmt = $pdo->query("SELECT SUM(r.price_per_ticket) FROM tickets t JOIN raffles r ON t.raffle_id = r.id WHERE t.status = 'paid'");
    $money = $stmt->fetchColumn() ?: 0;

    // Lista de compradores
    $stmt = $pdo->query("SELECT ticket_number, status, buyer_name, buyer_phone, buyer_email, updated_at FROM tickets WHERE status != 'available' ORDER BY updated_at DESC");

    $buyers = $stmt->fetchAll();

    echo json_encode([
        'success' => true,

        'stats' => $stats,
        'money' => $money,
        'buyers' => $buyers
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al cargar datos']);
}
