<?php
header('Content-Type: application/json');
require_once 'db.php';

$code = isset($_GET['code']) ? trim($_GET['code']) : '';

if ($code === '') {
    echo json_encode(['success' => false, 'code' => 'not_found', 'error' => 'Boleto no encontrado.']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT t.ticket_number, t.status, t.buyer_name, t.buyer_phone, t.updated_at,
               r.id AS raffle_id, r.slug AS raffle_slug, r.title AS raffle_title, r.draw_date,
               r.price_per_ticket, r.organizer_name, r.organizer_photo, r.payment_info, r.is_published, r.total_tickets
        FROM tickets t
        JOIN raffles r ON r.id = t.raffle_id
        WHERE t.ticket_code = ?
    ");
    $stmt->execute([$code]);
    $ticket = $stmt->fetch();

    if (!$ticket || $ticket['status'] === 'available' || (int)$ticket['is_published'] !== 1) {
        echo json_encode(['success' => false, 'code' => 'not_found', 'error' => 'Boleto no encontrado.']);
        exit;
    }

    // Enmascarar teléfono: solo se muestran los últimos 3 dígitos
    $phone = (string)$ticket['buyer_phone'];
    $maskedPhone = strlen($phone) > 3
        ? str_repeat('•', strlen($phone) - 3) . substr($phone, -3)
        : $phone;

    // Otros boletos del mismo comprador en esta rifa (mismo teléfono)
    $stmt2 = $pdo->prepare("
        SELECT ticket_number, ticket_code, status
        FROM tickets
        WHERE raffle_id = ? AND buyer_phone = ? AND status != 'available' AND ticket_number != ?
        ORDER BY ticket_number ASC
    ");
    $stmt2->execute([$ticket['raffle_id'], $ticket['buyer_phone'], $ticket['ticket_number']]);
    $otherRows = $stmt2->fetchAll();
    $otherTickets = array_map(function ($t) {
        return [
            'ticket_number' => (int)$t['ticket_number'],
            'code' => $t['ticket_code'],
            'status' => $t['status'] === 'paid' ? 'PAGADO' : 'APARTADO',
        ];
    }, $otherRows);

    echo json_encode([
        'success' => true,
        'code' => $code,
        'ticket_number' => (int)$ticket['ticket_number'],
        'status' => $ticket['status'] === 'paid' ? 'PAGADO' : 'APARTADO',
        'buyer_name' => $ticket['buyer_name'],
        'buyer_phone' => $maskedPhone,
        'updated_at' => $ticket['updated_at'],
        'other_tickets' => $otherTickets,
        'raffle' => [
            'slug' => $ticket['raffle_slug'],
            'title' => $ticket['raffle_title'],
            'draw_date' => $ticket['draw_date'],
            'price_per_ticket' => $ticket['price_per_ticket'],
            'organizer_name' => $ticket['organizer_name'],
            'organizer_photo' => $ticket['organizer_photo'],
            'payment_info' => $ticket['payment_info'],
            'total_tickets' => (int)$ticket['total_tickets'],
        ],
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'code' => 'server_error', 'error' => 'Error de base de datos']);
}
