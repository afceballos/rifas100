<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';
$raffle_id = (int)($data['raffle_id'] ?? 0);
$ticket_number = (int)($data['ticket_number'] ?? 0);

if ($raffle_id <= 0 || $ticket_number <= 0) {
    echo json_encode(['success' => false, 'message' => 'Datos inválidos.']);
    exit;
}

try {
    // Verificar que la rifa no esté eliminada
    $stmt = $pdo->prepare("SELECT status, deleted_at FROM raffles WHERE id = ?");
    $stmt->execute([$raffle_id]);
    $raffle = $stmt->fetch();
    if (!$raffle || $raffle['deleted_at'] !== null) {
        echo json_encode(['success' => false, 'message' => 'Rifa no encontrada o eliminada.']);
        exit;
    }

    if ($action === 'set_status') {
        $newStatus = $data['new_status'] ?? '';
        if (!in_array($newStatus, ['available', 'reserved', 'paid'], true)) {
            echo json_encode(['success' => false, 'message' => 'Estado inválido.']);
            exit;
        }

        if ($newStatus === 'available') {
            // Liberar: borrar datos del comprador
            $stmt = $pdo->prepare("UPDATE tickets SET status='available', buyer_name=NULL, buyer_phone=NULL, buyer_email=NULL WHERE raffle_id=? AND ticket_number=?");
            $stmt->execute([$raffle_id, $ticket_number]);
        } else {
            $stmt = $pdo->prepare("UPDATE tickets SET status=? WHERE raffle_id=? AND ticket_number=?");
            $stmt->execute([$newStatus, $raffle_id, $ticket_number]);
        }
        echo json_encode(['success' => true, 'message' => 'Boleto actualizado.']);
        exit;
    }

    if ($action === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM tickets WHERE raffle_id=? AND ticket_number=?");
        $stmt->execute([$raffle_id, $ticket_number]);
        echo json_encode(['success' => true, 'message' => 'Boleto eliminado.']);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Acción desconocida.']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
