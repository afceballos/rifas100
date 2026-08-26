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
    // "Vendidos" se cuenta por atribución real (tickets.seller_id), no por
    // rango: así funciona igual para vendedores con o sin rango asignado.
    $stmt = $pdo->prepare("
        SELECT
            s.id, s.code, s.name, s.phone, s.email, s.range_start, s.range_end, s.created_at,
            COUNT(t.id) AS sold_count
        FROM sellers s
        LEFT JOIN tickets t ON t.seller_id = s.id AND t.status != 'available'
        WHERE s.raffle_id = ?
        GROUP BY s.id
        ORDER BY s.created_at ASC
    ");
    $stmt->execute([$raffle_id]);
    $sellers = $stmt->fetchAll();

    foreach ($sellers as &$s) {
        $s['id'] = (int)$s['id'];
        $s['sold_count'] = (int)$s['sold_count'];
        if ($s['range_start'] !== null) {
            $s['range_start'] = (int)$s['range_start'];
            $s['range_end'] = (int)$s['range_end'];
            $s['total_count'] = $s['range_end'] - $s['range_start'] + 1;
        } else {
            $s['total_count'] = null;
        }
    }

    echo json_encode(['success' => true, 'sellers' => $sellers]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al cargar los vendedores']);
}
