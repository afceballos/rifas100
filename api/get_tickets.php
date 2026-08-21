<?php
header('Content-Type: application/json');
require_once 'db.php';

try {
    // Obtener la rifa activa (asumimos la primera para el MVP)
    $stmt = $pdo->query("SELECT id, title, price_per_ticket, draw_date, total_tickets FROM raffles LIMIT 1");
    $raffle = $stmt->fetch();

    if (!$raffle) {
        echo json_encode(['error' => 'No hay rifas configuradas.']);
        exit;
    }

    $raffle_id = $raffle['id'];

    // Verificar si los boletos ya fueron generados
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM tickets WHERE raffle_id = ?");
    $stmt->execute([$raffle_id]);
    $ticketCount = $stmt->fetchColumn();

    // Si no existen, los generamos automáticamente (Setup inicial)
    if ($ticketCount == 0) {
        $pdo->beginTransaction();
        $insertStmt = $pdo->prepare("INSERT INTO tickets (raffle_id, ticket_number, status) VALUES (?, ?, 'available')");
        for ($i = 1; $i <= $raffle['total_tickets']; $i++) {
            $insertStmt->execute([$raffle_id, $i]);
        }
        $pdo->commit();
    }

    // Obtener todos los boletos
    $stmt = $pdo->prepare("SELECT ticket_number as number, status FROM tickets WHERE raffle_id = ? ORDER BY ticket_number ASC");
    $stmt->execute([$raffle_id]);
    $tickets = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'raffle' => $raffle,
        'tickets' => $tickets
    ]);

} catch (Exception $e) {
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
}
