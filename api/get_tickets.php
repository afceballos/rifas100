<?php
header('Content-Type: application/json');
require_once 'db.php';

try {
    // Obtener la rifa publicada (la única visible al público).
    $stmt = $pdo->query("
      SELECT id, title, description, price_per_ticket, draw_date, digits, total_tickets
      FROM raffles
      WHERE status = 'published' AND deleted_at IS NULL
      ORDER BY updated_at DESC
      LIMIT 1
    ");
    $raffle = $stmt->fetch();

    if (!$raffle) {
        echo json_encode(['success' => true, 'raffle' => null, 'tickets' => []]);
        exit;
    }

    $raffle_id = (int)$raffle['id'];
    $digits = (int)$raffle['digits'];
    $total = (int)$raffle['total_tickets'];

    // Generar boletos si la tabla está vacía para esta rifa
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM tickets WHERE raffle_id = ?");
    $stmt->execute([$raffle_id]);
    $ticketCount = (int)$stmt->fetchColumn();

    if ($ticketCount === 0) {
        $pdo->beginTransaction();
        $insertStmt = $pdo->prepare("INSERT INTO tickets (raffle_id, ticket_number, status) VALUES (?, ?, 'available')");
        for ($i = 1; $i <= $total; $i++) {
            $insertStmt->execute([$raffle_id, $i]);
        }
        $pdo->commit();
    }

    // Obtener todos los boletos
    $stmt = $pdo->prepare("SELECT ticket_number as number, status FROM tickets WHERE raffle_id = ? ORDER BY ticket_number ASC");
    $stmt->execute([$raffle_id]);
    $tickets = $stmt->fetchAll();

    // Exponer digits al frontend para el padding
    $raffle['digits'] = $digits;

    echo json_encode([
        'success' => true,
        'raffle' => $raffle,
        'tickets' => $tickets
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
}
