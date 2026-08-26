<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$raffle_id = isset($_GET['raffle_id']) ? (int)$_GET['raffle_id'] : 0;
$seller_id = isset($_GET['seller_id']) ? (int)$_GET['seller_id'] : 0;

if ($raffle_id <= 0 || $seller_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

assert_raffle_ownership($pdo, $raffle_id);

try {
    $stmt = $pdo->prepare("
        SELECT ticket_number, status, buyer_name
        FROM tickets
        WHERE raffle_id = ? AND seller_id = ? AND status != 'available'
        ORDER BY ticket_number ASC
    ");
    $stmt->execute([$raffle_id, $seller_id]);
    $tickets = $stmt->fetchAll();

    foreach ($tickets as &$t) {
        $t['ticket_number'] = (int)$t['ticket_number'];
    }

    echo json_encode(['success' => true, 'tickets' => $tickets]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al cargar los boletos del vendedor']);
}
