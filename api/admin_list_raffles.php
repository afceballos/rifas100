<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

require_once 'db.php';

try {
    // Listar rifas no eliminadas con estadísticas agregadas
    $sql = "
      SELECT
        r.id, r.title, r.description, r.price_per_ticket, r.draw_date,
        r.digits, r.total_tickets, r.status, r.deleted_at, r.created_at, r.updated_at,
        COALESCE(SUM(t.status='available'), 0) AS available_count,
        COALESCE(SUM(t.status='reserved'), 0)  AS reserved_count,
        COALESCE(SUM(t.status='paid'), 0)      AS paid_count,
        COALESCE(SUM(t.status='paid') * r.price_per_ticket, 0) AS money
      FROM raffles r
      LEFT JOIN tickets t ON t.raffle_id = r.id
      WHERE r.deleted_at IS NULL
      GROUP BY r.id
      ORDER BY r.created_at DESC
    ";
    $stmt = $pdo->query($sql);
    $raffles = $stmt->fetchAll();

    // Convertir a tipos numéricos
    foreach ($raffles as &$r) {
        $r['id'] = (int)$r['id'];
        $r['digits'] = (int)$r['digits'];
        $r['total_tickets'] = (int)$r['total_tickets'];
        $r['available_count'] = (int)$r['available_count'];
        $r['reserved_count'] = (int)$r['reserved_count'];
        $r['paid_count'] = (int)$r['paid_count'];
        $r['money'] = (float)$r['money'];
    }
    unset($r);

    echo json_encode(['success' => true, 'raffles' => $raffles]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error al cargar rifas']);
}
