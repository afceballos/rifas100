<?php
header('Content-Type: application/json');
require_once 'db.php';
require_once 'auth.php';

require_auth();

$raffle_id = (int)($_GET['id'] ?? 0);
if ($raffle_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'ID de rifa inválido']);
    exit;
}

try {
    // Stats por estado para esta rifa
    $stmt = $pdo->prepare("
        SELECT status, COUNT(*) AS total
        FROM tickets
        WHERE raffle_id = ?
        GROUP BY status
    ");
    $stmt->execute([$raffle_id]);
    $rows = $stmt->fetchAll();

    $stats = ['available' => 0, 'reserved' => 0, 'paid' => 0];
    foreach ($rows as $r) {
        $stats[$r['status']] = (int)$r['total'];
    }

    // Dinero recaudado: boletos pagados * precio del boleto
    $stmt = $pdo->prepare("SELECT price_per_ticket FROM raffles WHERE id = ?");
    $stmt->execute([$raffle_id]);
    $raffle = $stmt->fetch();
    $price = $raffle ? (float)$raffle['price_per_ticket'] : 0;
    $money = $stats['paid'] * $price;

    // Lista de compradores (boletos con datos)
    $stmt = $pdo->prepare("
        SELECT ticket_number, buyer_name, buyer_phone, buyer_email, status, updated_at
        FROM tickets
        WHERE raffle_id = ? AND buyer_name IS NOT NULL AND buyer_name <> ''
        ORDER BY updated_at DESC
    ");
    $stmt->execute([$raffle_id]);
    $buyers = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'stats'   => $stats,
        'money'   => $money,
        'buyers'  => $buyers,
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al cargar datos']);
}
