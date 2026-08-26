<?php
require_once 'auth.php';
require_once 'db.php';
require_once 'slug_helper.php';
header('Content-Type: application/json');

require_auth();

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['title']) || empty($data['price_per_ticket']) || empty($data['draw_date']) || empty($data['digits'])) {
    echo json_encode(['success' => false, 'error' => 'Faltan datos requeridos']);
    exit;
}

// Digits: 2 (100 boletos: 00-99), 3 (1000 boletos: 000-999), 4 (10000 boletos: 0000-9999)
$digits = (int)$data['digits'];
if (!in_array($digits, [2, 3, 4])) {
    echo json_encode(['success' => false, 'error' => 'Número de cifras inválido']);
    exit;
}
$total_tickets = pow(10, $digits);
$description = isset($data['description']) && $data['description'] !== '' ? $data['description'] : null;
$organizerName = isset($data['organizer_name']) && $data['organizer_name'] !== '' ? trim($data['organizer_name']) : null;
$organizerPhone = isset($data['organizer_phone']) && trim($data['organizer_phone']) !== '' ? trim($data['organizer_phone']) : null;
$organizerEmail = isset($data['organizer_email']) && trim($data['organizer_email']) !== '' ? trim($data['organizer_email']) : null;

if ($organizerEmail !== null && !filter_var($organizerEmail, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Correo del organizador inválido']);
    exit;
}

$slug = generate_raffle_slug($pdo);

try {
    $pdo->beginTransaction();
    // Insertar la rifa bajo el tenant del usuario logueado
    $stmt = $pdo->prepare("INSERT INTO raffles (slug, tenant_id, title, description, organizer_name, organizer_phone, organizer_email, price_per_ticket, draw_date, total_tickets) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$slug, current_tenant_id(), $data['title'], $description, $organizerName, $organizerPhone, $organizerEmail, $data['price_per_ticket'], $data['draw_date'], $total_tickets]);
    $raffle_id = $pdo->lastInsertId();

    // Generar boletos masivamente (Se hace en bloques para no saturar si son 10,000)
    $insertQuery = "INSERT INTO tickets (raffle_id, ticket_number, status) VALUES ";
    $insertData = [];
    $values = [];

    for ($i = 0; $i < $total_tickets; $i++) {
        $values[] = "(?, ?, 'available')";
        $insertData[] = $raffle_id;
        $insertData[] = $i;

        // Ejecutar en bloques de 1000 para eficiencia
        if (($i + 1) % 1000 == 0 || $i == $total_tickets - 1) {
            $stmt = $pdo->prepare($insertQuery . implode(',', $values));
            $stmt->execute($insertData);
            $values = [];
            $insertData = [];
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'raffle_id' => $raffle_id, 'slug' => $slug]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
