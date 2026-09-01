<?php
header('Content-Type: application/json');
require_once 'db.php';

function ticket_status_label($status) {
    if ($status === 'paid') return 'PAGADO';
    if ($status === 'reviewing') return 'REVISANDO';
    return 'APARTADO';
}

$code = isset($_GET['code']) ? trim($_GET['code']) : '';

if ($code === '') {
    echo json_encode(['success' => false, 'code' => 'not_found', 'error' => 'Boleto no encontrado.']);
    exit;
}

try {
    // Un código de boleto ahora representa una compra completa: puede haber
    // varias filas (una por número) compartiendo el mismo ticket_code.
    $stmt = $pdo->prepare("
        SELECT t.ticket_number, t.status, t.buyer_name, t.buyer_phone, t.updated_at, t.receipt_image,
               r.id AS raffle_id, r.slug AS raffle_slug, r.title AS raffle_title, r.draw_date,
               r.price_per_ticket, r.organizer_name, r.organizer_photo, r.payment_info, r.is_published, r.total_tickets, r.number_start,
               r.receipt_upload_enabled, r.online_payment_link
        FROM tickets t
        JOIN raffles r ON r.id = t.raffle_id
        WHERE t.ticket_code = ?
        ORDER BY t.ticket_number ASC
    ");
    $stmt->execute([$code]);
    $rows = $stmt->fetchAll();
    $rows = array_values(array_filter($rows, function ($r) { return $r['status'] !== 'available'; }));

    if (empty($rows) || (int)$rows[0]['is_published'] !== 1) {
        echo json_encode(['success' => false, 'code' => 'not_found', 'error' => 'Boleto no encontrado.']);
        exit;
    }

    $first = $rows[0];
    $ticketNumbers = array_map(function ($r) { return (int)$r['ticket_number']; }, $rows);

    // Enmascarar teléfono: solo se muestran los últimos 3 dígitos
    $phone = (string)$first['buyer_phone'];
    $maskedPhone = strlen($phone) > 3
        ? str_repeat('•', strlen($phone) - 3) . substr($phone, -3)
        : $phone;

    // Otras compras del mismo comprador en esta rifa (mismo teléfono, código distinto)
    $stmt2 = $pdo->prepare("
        SELECT ticket_number, ticket_code, status
        FROM tickets
        WHERE raffle_id = ? AND buyer_phone = ? AND status != 'available' AND (ticket_code IS NULL OR ticket_code != ?)
        ORDER BY ticket_number ASC
    ");
    $stmt2->execute([$first['raffle_id'], $first['buyer_phone'], $code]);
    $otherRows = $stmt2->fetchAll();
    $otherTickets = array_map(function ($t) {
        return [
            'ticket_number' => (int)$t['ticket_number'],
            'code' => $t['ticket_code'],
            'status' => ticket_status_label($t['status']),
        ];
    }, $otherRows);

    echo json_encode([
        'success' => true,
        'code' => $code,
        'ticket_number' => $ticketNumbers[0],
        'ticket_numbers' => $ticketNumbers,
        'status' => ticket_status_label($first['status']),
        'buyer_name' => $first['buyer_name'],
        'buyer_phone' => $maskedPhone,
        'updated_at' => $first['updated_at'],
        'receipt_image' => $first['receipt_image'],
        'other_tickets' => $otherTickets,
        'raffle' => [
            'slug' => $first['raffle_slug'],
            'title' => $first['raffle_title'],
            'draw_date' => $first['draw_date'],
            'price_per_ticket' => $first['price_per_ticket'],
            'organizer_name' => $first['organizer_name'],
            'organizer_photo' => $first['organizer_photo'],
            'payment_info' => $first['payment_info'],
            'total_tickets' => (int)$first['total_tickets'],
            'number_start' => (int)$first['number_start'],
            'receipt_upload_enabled' => (int)$first['receipt_upload_enabled'] === 1,
            'online_payment_link' => $first['online_payment_link'],
        ],
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'code' => 'server_error', 'error' => 'Error de base de datos']);
}
