<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$raffle_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($raffle_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'ID de sorteo inválido']);
    exit;
}

assert_raffle_ownership($pdo, $raffle_id);

try {
    // Datos de la rifa
    $stmtRaffle = $pdo->prepare("SELECT id, slug, title, description, background_image, payment_info, organizer_name, organizer_photo, organizer_phone, organizer_email, theme_color, number_style, bg_color, allow_seller_selection, price_per_ticket, draw_date, total_tickets, is_published FROM raffles WHERE id = ?");
    $stmtRaffle->execute([$raffle_id]);
    $raffle = $stmtRaffle->fetch();

    if (!$raffle) {
        echo json_encode(['success' => false, 'error' => 'Sorteo no encontrado']);
        exit;
    }

    // Stats de boletos
    $stmt = $pdo->prepare("
        SELECT
            COUNT(CASE WHEN status = 'available' THEN 1 END) AS available,
            COUNT(CASE WHEN status = 'reserved' THEN 1 END) AS reserved,
            COUNT(CASE WHEN status = 'reviewing' THEN 1 END) AS reviewing,
            COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid
        FROM tickets WHERE raffle_id = ?
    ");
    $stmt->execute([$raffle_id]);
    $stats = $stmt->fetch();

    // Dinero recaudado (solo boletos pagados)
    $stmt2 = $pdo->prepare("
        SELECT COALESCE(SUM(r.price_per_ticket), 0) AS money
        FROM tickets t
        JOIN raffles r ON r.id = t.raffle_id
        WHERE t.raffle_id = ? AND t.status = 'paid'
    ");
    $stmt2->execute([$raffle_id]);
    $money = $stmt2->fetchColumn();

    // Listado de compradores (boletos reservados o pagados)
    $stmt3 = $pdo->prepare("
        SELECT t.ticket_number, t.ticket_code, t.buyer_name, t.buyer_phone, t.buyer_email, t.status,
               t.receipt_image, t.admin_notes, t.created_at, t.seller_id, s.name AS seller_name, s.code AS seller_code
        FROM tickets t
        LEFT JOIN sellers s ON s.id = t.seller_id
        WHERE t.raffle_id = ? AND t.status != 'available'
        ORDER BY t.ticket_number ASC
    ");
    $stmt3->execute([$raffle_id]);
    $buyers = $stmt3->fetchAll();

    echo json_encode([
        'success' => true,
        'raffle'  => $raffle,
        'stats'   => $stats,
        'money'   => $money,
        'buyers'  => $buyers,
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al cargar datos']);
}
