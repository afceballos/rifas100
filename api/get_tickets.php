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
    $stmt = $pdo->prepare("SELECT id, slug, title, description, background_image, payment_info, organizer_name, organizer_photo, organizer_phone, organizer_email, theme_color, number_style, bg_color, allow_seller_selection, price_per_ticket, draw_date, total_tickets, number_start, is_published FROM raffles WHERE slug = ?");
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

    // Datos públicos de vendedores: permiten filtrar por ?seller=CODE, mostrar
    // su contacto a quien entre por su enlace, y (si allow_seller_selection
    // está activo) listar opciones al reservar.
    $sellersStmt = $pdo->prepare("
        SELECT s.code, s.name, s.phone, s.email, s.range_start, s.range_end,
               GROUP_CONCAT(sn.ticket_number ORDER BY sn.ticket_number) AS numbers_csv
        FROM sellers s
        LEFT JOIN seller_numbers sn ON sn.seller_id = s.id
        WHERE s.raffle_id = ?
        GROUP BY s.id
        ORDER BY s.created_at ASC
    ");
    $sellersStmt->execute([$raffleId]);
    $sellers = $sellersStmt->fetchAll();
    foreach ($sellers as &$s) {
        if ($s['range_start'] !== null) {
            $s['range_start'] = (int)$s['range_start'];
            $s['range_end'] = (int)$s['range_end'];
        }
        $s['numbers'] = $s['numbers_csv'] ? array_map('intval', explode(',', $s['numbers_csv'])) : [];
        unset($s['numbers_csv']);
    }

    echo json_encode([
        'success' => true,
        'raffle' => $raffle,
        'tickets' => $tickets,
        'offset' => $offset,
        'limit' => $limit,
        'available_count' => $availableCount,
        'sellers' => $sellers,
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'code' => 'server_error', 'error' => 'Error de base de datos']);
}
