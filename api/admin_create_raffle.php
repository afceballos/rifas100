<?php
header('Content-Type: application/json');
require_once 'db.php';
require_once 'auth.php';

require_auth();

$data = json_decode(file_get_contents('php://input'), true);

$title           = trim($data['title'] ?? '');
$price_per_ticket = $data['price_per_ticket'] ?? null;
$draw_date       = trim($data['draw_date'] ?? '');
$digits          = (int)($data['digits'] ?? 0);

if ($title === '' || !is_numeric($price_per_ticket) || $draw_date === '' || !in_array($digits, [2, 3, 4])) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

// Digits: 2 (100 boletos: 00-99), 3 (1000 boletos: 000-999), 4 (10000 boletos: 0000-9999)
$total_tickets = pow(10, $digits);

try {
    $pdo->beginTransaction();

    // Insertar la rifa (tenant_id 1 = admin único en MVP)
    $stmt = $pdo->prepare("INSERT INTO raffles (tenant_id, title, price_per_ticket, draw_date, total_tickets) VALUES (1, ?, ?, ?, ?)");
    $stmt->execute([$title, $price_per_ticket, $draw_date, $total_tickets]);
    $raffle_id = $pdo->lastInsertId();

    // Generar boletos masivamente en bloques para no saturar la conexión
    $insertQuery = "INSERT INTO tickets (raffle_id, ticket_number, status) VALUES ";
    $values = [];
    $insertData = [];

    for ($i = 0; $i < $total_tickets; $i++) {
        $values[] = "(?, ?, 'available')";
        $insertData[] = $raffle_id;
        $insertData[] = $i;

        if (($i + 1) % 1000 == 0 || $i == $total_tickets - 1) {
            $stmt = $pdo->prepare($insertQuery . implode(',', $values));
            $stmt->execute($insertData);
            $values = [];
            $insertData = [];
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'raffle_id' => $raffle_id]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
