<?php
require_once 'seller_auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_seller_auth($pdo);

try {
    $raffle_id = current_seller_raffle_id();
    $seller_id = current_seller_id();

    // Agrupado por compra (ticket_code): todos los números reservados juntos
    // en una misma compra se muestran como un solo comprador.
    $stmt = $pdo->prepare("
        SELECT
            ticket_code,
            GROUP_CONCAT(ticket_number ORDER BY ticket_number) AS ticket_numbers,
            MIN(buyer_name) AS buyer_name,
            MIN(buyer_phone) AS buyer_phone,
            MIN(buyer_email) AS buyer_email,
            MIN(status) AS status,
            MIN(receipt_image) AS receipt_image,
            MIN(created_at) AS created_at
        FROM tickets
        WHERE raffle_id = ? AND seller_id = ? AND status != 'available'
        GROUP BY ticket_code
        ORDER BY MIN(ticket_number) ASC
    ");
    $stmt->execute([$raffle_id, $seller_id]);
    $rows = $stmt->fetchAll();

    $tickets = array_map(function ($row) {
        $row['ticket_numbers'] = array_map('intval', explode(',', $row['ticket_numbers']));
        return $row;
    }, $rows);

    $stmtRaffle = $pdo->prepare("SELECT price_per_ticket FROM raffles WHERE id = ?");
    $stmtRaffle->execute([$raffle_id]);
    $price = (float)$stmtRaffle->fetchColumn();

    $paidCount = 0;
    foreach ($tickets as $t) {
        if ($t['status'] === 'paid') $paidCount += count($t['ticket_numbers']);
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
