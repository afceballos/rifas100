<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

require_once 'db.php';

$raffle_id = (int)($_GET['raffle_id'] ?? 0);
if ($raffle_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'raffle_id requerido']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, digits, total_tickets FROM raffles WHERE id = ? AND deleted_at IS NULL");
    $stmt->execute([$raffle_id]);
    $raffle = $stmt->fetch();
    if (!$raffle) {
        echo json_encode(['success' => false, 'message' => 'Rifa no encontrada']);
        exit;
    }

    $digits = (int)$raffle['digits'];
    $total = (int)$raffle['total_tickets'];

    // Auto-generar boletos si la tabla está vacía para esta rifa
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM tickets WHERE raffle_id = ?");
    $stmt->execute([$raffle_id]);
    $cnt = (int)$stmt->fetchColumn();

    if ($cnt === 0) {
        $pdo->beginTransaction();
        $insertTicket = $pdo->prepare("INSERT INTO tickets (raffle_id, ticket_number, status) VALUES (?, ?, 'available')");
        for ($i = 1; $i <= $total; $i++) {
            $insertTicket->execute([$raffle_id, $i]);
        }
        $pdo->commit();
    }

    $stmt = $pdo->prepare("SELECT ticket_number as number, status, buyer_name, buyer_phone, buyer_email, updated_at FROM tickets WHERE raffle_id = ? ORDER BY ticket_number ASC");
    $stmt->execute([$raffle_id]);
    $tickets = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'raffle' => ['id' => $raffle_id, 'digits' => $digits, 'total_tickets' => $total],
        'tickets' => $tickets,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
