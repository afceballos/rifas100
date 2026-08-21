<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['admin_id'])) { echo json_encode(['success' => false, 'error' => 'No autorizado']); exit; }
require_once 'db.php';

$raffle_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

try {
    // Estadísticas
    $stmt = $pdo->prepare("SELECT status, COUNT(*) as count FROM tickets WHERE raffle_id = ? GROUP BY status");
    $stmt->execute([$raffle_id]);
    $rawStats = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $stats = [
        'available' => $rawStats['available'] ?? 0,
        'reserved' => $rawStats['reserved'] ?? 0,
        'paid' => $rawStats['paid'] ?? 0
    ];

    // Dinero total
    $stmt = $pdo->prepare("SELECT SUM(r.price_per_ticket) FROM tickets t JOIN raffles r ON t.raffle_id = r.id WHERE t.raffle_id = ? AND t.status = 'paid'");
    $stmt->execute([$raffle_id]);
    $money = $stmt->fetchColumn() ?: 0;

    // Lista de compradores
    $stmt = $pdo->prepare("SELECT ticket_number, status, buyer_name, buyer_phone, buyer_email, updated_at FROM tickets WHERE raffle_id = ? AND status != 'available' ORDER BY updated_at DESC");
    $stmt->execute([$raffle_id]);
    $buyers = $stmt->fetchAll();

    echo json_encode(['success' => true, 'stats' => $stats, 'money' => $money, 'buyers' => $buyers]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al cargar datos']);
}
