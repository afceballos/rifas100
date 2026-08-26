<?php
header('Content-Type: application/json');
require_once 'db.php';

$slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';
$offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;
$limit = isset($_GET['limit']) ? min(1000, max(1, (int)$_GET['limit'])) : 1000;

if ($slug === '') {
    echo json_encode(['success' => false, 'code' => 'not_found', 'error' => 'Rifa no encontrada.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, slug, title, description, background_image, payment_info, organizer_name, organizer_photo, theme_color, number_style, price_per_ticket, draw_date, total_tickets, is_published FROM raffles WHERE slug = ?");
    $stmt->execute([$slug]);
    $raffle = $stmt->fetch();

    if (!$raffle) {
        echo json_encode(['success' => false, 'code' => 'not_found', 'error' => 'Rifa no encontrada.']);
        exit;
    }

    if ((int)$raffle['is_published'] !== 1) {
        echo json_encode(['success' => false, 'code' => 'unpublished', 'error' => 'Esta rifa no está disponible.']);
        exit;
    }

    $raffleId = (int)$raffle['id'];

    $stmt = $pdo->prepare("SELECT ticket_number as number, status FROM tickets WHERE raffle_id = ? ORDER BY ticket_number ASC LIMIT ? OFFSET ?");
    $stmt->bindValue(1, $raffleId, PDO::PARAM_INT);
    $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    $stmt->bindValue(3, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $tickets = $stmt->fetchAll();

    // Conteo global (no solo de la página actual) para la barra flotante
    $countStmt = $pdo->prepare("SELECT COUNT(CASE WHEN status = 'available' THEN 1 END) AS available_count FROM tickets WHERE raffle_id = ?");
    $countStmt->execute([$raffleId]);
    $availableCount = (int)$countStmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'raffle' => $raffle,
        'tickets' => $tickets,
        'offset' => $offset,
        'limit' => $limit,
        'available_count' => $availableCount
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'code' => 'server_error', 'error' => 'Error de base de datos']);
}
