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

function totalFromDigits($d) {
    $d = (int)$d;
    if ($d < 2 || $d > 4) return 0;
    return (int)pow(10, $d);
}

try {
    if ($action === 'create') {
        $title = trim($data['title'] ?? '');
        $description = trim($data['description'] ?? '');
        $price = (float)($data['price_per_ticket'] ?? 0);
        $draw = trim($data['draw_date'] ?? '');
        $digits = (int)($data['digits'] ?? 3);

        if ($title === '' || $price <= 0 || $draw === '') {
            echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios.']);
            exit;
        }
        if ($digits < 2 || $digits > 4) {
            echo json_encode(['success' => false, 'message' => 'Dígitos deben ser 2, 3 o 4.']);
            exit;
        }
        $total = totalFromDigits($digits);

        // Convertir datetime-local (YYYY-MM-DDTHH:MM) a formato MySQL
        $drawSql = str_replace('T', ' ', $draw);
        if (strlen($drawSql) === 16) $drawSql .= ':00';

        $pdo->beginTransaction();

        // Tenant por defecto (1) si no hay uno
        $tenant_id = (int)($_SESSION['tenant_id'] ?? 1);

        $stmt = $pdo->prepare("
          INSERT INTO raffles (tenant_id, title, description, price_per_ticket, draw_date, digits, total_tickets, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
        ");
        $stmt->execute([$tenant_id, $title, $description, $price, $drawSql, $digits, $total]);
        $raffle_id = (int)$pdo->lastInsertId();

        // Generar boletos
        $insertTicket = $pdo->prepare("INSERT INTO tickets (raffle_id, ticket_number, status) VALUES (?, ?, 'available')");
        for ($i = 1; $i <= $total; $i++) {
            $insertTicket->execute([$raffle_id, $i]);
        }

        $pdo->commit();

        echo json_encode(['success' => true, 'raffle_id' => $raffle_id, 'message' => 'Rifa creada en borrador.']);
        exit;
    }

    if ($action === 'update') {
        $id = (int)($data['raffle_id'] ?? 0);
        if ($id <= 0) { echo json_encode(['success' => false, 'message' => 'ID inválido.']); exit; }

        $fields = [];
        $params = [];
        foreach (['title', 'description'] as $k) {
            if (isset($data[$k])) { $fields[] = "$k = ?"; $params[] = trim($data[$k]); }
        }
        if (isset($data['price_per_ticket'])) { $fields[] = 'price_per_ticket = ?'; $params[] = (float)$data['price_per_ticket']; }
        if (isset($data['draw_date'])) {
            $d = str_replace('T', ' ', trim($data['draw_date']));
            if (strlen($d) === 16) $d .= ':00';
            $fields[] = 'draw_date = ?';
            $params[] = $d;
        }
        if (!$fields) { echo json_encode(['success' => false, 'message' => 'Nada que actualizar.']); exit; }
        $params[] = $id;
        $sql = "UPDATE raffles SET " . implode(', ', $fields) . " WHERE id = ? AND deleted_at IS NULL";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode(['success' => true, 'message' => 'Rifa actualizada.']);
        exit;
    }

    if ($action === 'set_status') {
        $id = (int)($data['raffle_id'] ?? 0);
        $newStatus = $data['status'] ?? '';
        if ($id <= 0 || !in_array($newStatus, ['draft', 'published', 'archived'], true)) {
            echo json_encode(['success' => false, 'message' => 'Datos inválidos.']); exit;
        }

        $pdo->beginTransaction();

        // Si va a publicar, despublicar cualquier otra rifa activa (single-published rule)
        if ($newStatus === 'published') {
            $stmt = $pdo->prepare("UPDATE raffles SET status='draft' WHERE status='published' AND deleted_at IS NULL AND id <> ?");
            $stmt->execute([$id]);
        }

        $stmt = $pdo->prepare("UPDATE raffles SET status = ? WHERE id = ? AND deleted_at IS NULL");
        $stmt->execute([$newStatus, $id]);

        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => 'Rifa no encontrada.']);
            exit;
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Estado actualizado.']);
        exit;
    }

    if ($action === 'soft_delete') {
        $id = (int)($data['raffle_id'] ?? 0);
        if ($id <= 0) { echo json_encode(['success' => false, 'message' => 'ID inválido.']); exit; }
        $stmt = $pdo->prepare("UPDATE raffles SET deleted_at = NOW(), status='archived' WHERE id = ? AND deleted_at IS NULL");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Rifa eliminada.']);
        exit;
    }

    if ($action === 'restore') {
        $id = (int)($data['raffle_id'] ?? 0);
        if ($id <= 0) { echo json_encode(['success' => false, 'message' => 'ID inválido.']); exit; }
        $stmt = $pdo->prepare("UPDATE raffles SET deleted_at = NULL, status='draft' WHERE id = ? AND deleted_at IS NOT NULL");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Rifa restaurada como borrador.']);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Acción desconocida.']);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
