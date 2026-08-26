<?php
require_once 'seller_auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_seller_auth($pdo);

try {
    $raffle_id = current_seller_raffle_id();
    $seller_id = current_seller_id();

    $stmt = $pdo->prepare("
        SELECT ticket_number, ticket_code, buyer_name, buyer_phone, buyer_email, status, receipt_image, created_at
        FROM tickets
        WHERE raffle_id = ? AND seller_id = ? AND status != 'available'
        ORDER BY ticket_number ASC
    ");
    $stmt->execute([$raffle_id, $seller_id]);
    $tickets = $stmt->fetchAll();

    $stmtRaffle = $pdo->prepare("SELECT price_per_ticket FROM raffles WHERE id = ?");
    $stmtRaffle->execute([$raffle_id]);
    $price = (float)$stmtRaffle->fetchColumn();

    $paidCount = 0;
    foreach ($tickets as $t) {
        if ($t['status'] === 'paid') $paidCount++;
    }

    echo json_encode([
        'success' => true,
        'tickets' => $tickets,
        'price_per_ticket' => $price,
        'money_collected' => round($paidCount * $price, 2),
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al cargar tus boletos']);
}
