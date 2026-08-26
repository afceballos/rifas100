<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$raffle_id = isset($_GET['raffle_id']) ? (int)$_GET['raffle_id'] : 0;

if ($raffle_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'ID de sorteo inválido']);
    exit;
}

assert_raffle_ownership($pdo, $raffle_id);

try {
    $stmt = $pdo->prepare("
        SELECT
            s.id, s.code, s.name, s.phone, s.email, s.range_start, s.range_end, s.created_at,
            COUNT(CASE WHEN t.status != 'available' THEN 1 END) AS sold_count
        FROM sellers s
        LEFT JOIN tickets t ON t.raffle_id = s.raffle_id AND t.ticket_number BETWEEN s.range_start AND s.range_end
        WHERE s.raffle_id = ?
        GROUP BY s.id
        ORDER BY s.range_start ASC
    ");
    $stmt->execute([$raffle_id]);
    $sellers = $stmt->fetchAll();

    foreach ($sellers as &$s) {
        $s['id'] = (int)$s['id'];
        $s['range_start'] = (int)$s['range_start'];
        $s['range_end'] = (int)$s['range_end'];
        $s['sold_count'] = (int)$s['sold_count'];
        $s['total_count'] = $s['range_end'] - $s['range_start'] + 1;
    }

    echo json_encode(['success' => true, 'sellers' => $sellers]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al cargar los vendedores']);
}
