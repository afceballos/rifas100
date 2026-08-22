<?php
header('Content-Type: application/json');
require_once 'db.php';

$raffle_id = isset($_GET['raffle_id']) ? (int)$_GET['raffle_id'] : 0;
$type = isset($_GET['type']) ? $_GET['type'] : 'ticket';
$query = isset($_GET['query']) ? trim($_GET['query']) : '';

if ($raffle_id <= 0 || $query === '' || !in_array($type, ['ticket', 'email', 'phone'], true)) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

function build_result($ticket, $raffle_id) {
    $phone = (string)$ticket['buyer_phone'];
    $maskedPhone = strlen($phone) > 3
        ? str_repeat('•', strlen($phone) - 3) . substr($phone, -3)
        : $phone;

    // Mismo código único que identifica el boleto (/ticket/:code); se muestra
    // enmascarado aquí porque el número de boleto es fácil de adivinar y no
    // queremos que cualquiera pueda reconstruir enlaces ajenos por fuerza bruta.
    $code = (string)$ticket['ticket_code'];
    $maskedCode = strlen($code) > 4
        ? str_repeat('•', strlen($code) - 4) . substr($code, -4)
        : $code;

    return [
        'buyer_name' => $ticket['buyer_name'],
        'buyer_phone' => $maskedPhone,
        'ticket_number' => (int)$ticket['ticket_number'],
        'status' => $ticket['status'] === 'paid' ? 'PAGADO' : ($ticket['status'] === 'reviewing' ? 'REVISANDO' : 'APARTADO'),
        'updated_at' => $ticket['updated_at'],
        'code' => $maskedCode,
    ];
}

try {
    if ($type === 'ticket') {
        if (!ctype_digit($query)) {
            echo json_encode(['success' => true, 'results' => []]);
            exit;
        }
        $stmt = $pdo->prepare("SELECT id, ticket_number, ticket_code, status, buyer_name, buyer_phone, updated_at FROM tickets WHERE raffle_id = ? AND ticket_number = ? AND status != 'available'");
        $stmt->execute([$raffle_id, (int)$query]);
        $rows = $stmt->fetchAll();
    } elseif ($type === 'email') {
        $stmt = $pdo->prepare("SELECT id, ticket_number, ticket_code, status, buyer_name, buyer_phone, updated_at FROM tickets WHERE raffle_id = ? AND status != 'available' AND LOWER(buyer_email) = LOWER(?) ORDER BY ticket_number ASC LIMIT 200");
        $stmt->execute([$raffle_id, $query]);
        $rows = $stmt->fetchAll();
    } else { // phone
        // Comparación flexible: solo dígitos, para tolerar espacios/guiones distintos
        $digitsQuery = preg_replace('/\D/', '', $query);
        if ($digitsQuery === '') {
            echo json_encode(['success' => true, 'results' => []]);
            exit;
        }
        $stmt = $pdo->prepare("SELECT id, ticket_number, ticket_code, status, buyer_name, buyer_phone, updated_at FROM tickets WHERE raffle_id = ? AND status != 'available' AND buyer_phone IS NOT NULL LIMIT 2000");
        $stmt->execute([$raffle_id]);
        $rows = array_values(array_filter($stmt->fetchAll(), function ($t) use ($digitsQuery) {
            return preg_replace('/\D/', '', (string)$t['buyer_phone']) === $digitsQuery;
        }));
    }

    $results = array_map(fn($t) => build_result($t, $raffle_id), $rows);

    echo json_encode(['success' => true, 'results' => $results]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error de base de datos']);
}
