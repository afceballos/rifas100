<?php
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$raffle_id = (int)($data['id'] ?? 0);
$action = $data['action'] ?? '';

if ($raffle_id < 1) {
    echo json_encode(['success' => false, 'error' => 'Rifa inválida']);
    exit;
}

try {
    if ($action === 'publish' || $action === 'unpublish') {
        $status = $action === 'publish' ? 'published' : 'draft';
        $stmt = $pdo->prepare("UPDATE raffles SET status = ? WHERE id = ?");
        $stmt->execute([$status, $raffle_id]);
        echo json_encode(['success' => true, 'status' => $status]);
        exit;
    }

    if ($action === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM raffles WHERE id = ?");
        $stmt->execute([$raffle_id]);
        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'edit') {
        $title = trim($data['title'] ?? '');
        $description = trim($data['description'] ?? '');
        $price = $data['price_per_ticket'] ?? null;
        $draw_date = trim($data['draw_date'] ?? '');
        $digits = (int)($data['digits'] ?? 0);
        $draw_date = str_replace('T', ' ', $draw_date);

        if ($title === '' || !is_numeric($price) || $draw_date === '' || !in_array($digits, [2, 3, 4], true)) {
            echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT digits, total_tickets FROM raffles WHERE id = ?");
        $stmt->execute([$raffle_id]);
        $current = $stmt->fetch();
        if (!$current) {
            echo json_encode(['success' => false, 'error' => 'Rifa no encontrada']);
            exit;
        }
        if ((int)$current['digits'] !== $digits) {
            $ticketStmt = $pdo->prepare("SELECT COUNT(*) FROM tickets WHERE raffle_id = ? AND status != 'available'");
            $ticketStmt->execute([$raffle_id]);
            if ((int)$ticketStmt->fetchColumn() > 0) {
                echo json_encode(['success' => false, 'error' => 'No puedes cambiar las cifras después de reservar boletos']);
                exit;
            }
            $pdo->beginTransaction();
            $pdo->prepare("DELETE FROM tickets WHERE raffle_id = ?")->execute([$raffle_id]);
            $total = 10 ** $digits;
            $pdo->prepare("UPDATE raffles SET title = ?, description = ?, price_per_ticket = ?, draw_date = ?, digits = ?, total_tickets = ? WHERE id = ?")
                ->execute([$title, $description, $price, $draw_date, $digits, $total, $raffle_id]);
            $insert = $pdo->prepare("INSERT INTO tickets (raffle_id, ticket_number, status) VALUES (?, ?, 'available')");
            for ($number = 0; $number < $total; $number++) {
                $insert->execute([$raffle_id, $number]);
            }
            $pdo->commit();
        } else {
            $stmt = $pdo->prepare("UPDATE raffles SET title = ?, description = ?, price_per_ticket = ?, draw_date = ? WHERE id = ?");
            $stmt->execute([$title, $description, $price, $draw_date, $raffle_id]);
        }
        echo json_encode(['success' => true]);
        exit;
    }

    echo json_encode(['success' => false, 'error' => 'Acción inválida']);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'error' => 'No se pudo actualizar la rifa']);
}
