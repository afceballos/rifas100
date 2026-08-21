<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

require_once 'db.php';

$raffle_id = isset($_GET['raffle_id']) ? (int)$_GET['raffle_id'] : 0;

try {
    if ($raffle_id <= 0) {
        // Default: rifa publicada
        $stmt = $pdo->query("SELECT id FROM raffles WHERE status='published' AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 1");
        $raffle_id = (int)$stmt->fetchColumn();
    }

    if ($raffle_id <= 0) {
        echo json_encode([
            'success' => true,
            'raffle_id' => 0,
            'stats' => ['available' => 0, 'reserved' => 0, 'paid' => 0],
            'money' => 0,
            'buyers' => []
        ]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT status, COUNT(*) as count FROM tickets WHERE raffle_id = ? GROUP BY status");
    $stmt->execute([$raffle_id]);
    $rawStats = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    $stats = [
        'available' => (int)($rawStats['available'] ?? 0),
        'reserved'  => (int)($rawStats['reserved']  ?? 0),
        'paid'      => (int)($rawStats['paid']      ?? 0),
    ];

    $stmt = $pdo->prepare("SELECT r.price_per_ticket FROM tickets t JOIN raffles r ON r.id = t.raffle_id WHERE t.raffle_id = ? AND t.status = 'paid'");
    $stmt->execute([$raffle_id]);
    $paidCount = (int)$stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT price_per_ticket FROM raffles WHERE id = ?");
    $stmt->execute([$raffle_id]);
    $price = (float)$stmt->fetchColumn();
    $money = $paidCount * $price;

    $stmt = $pdo->prepare("SELECT ticket_number, status, buyer_name, buyer_phone, buyer_email, updated_at FROM tickets WHERE raffle_id = ? AND status != 'available' ORDER BY updated_at DESC");
    $stmt->execute([$raffle_id]);
    $buyers = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'raffle_id' => $raffle_id,
        'stats' => $stats,
        'money' => $money,
        'buyers' => $buyers
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error al cargar datos']);
}
