<?php
header('Content-Type: application/json');
require_once 'db.php';

$raffle_id = isset($_GET['raffle_id']) ? (int)$_GET['raffle_id'] : 0;
$count = isset($_GET['count']) ? (int)$_GET['count'] : 0;

if ($raffle_id <= 0 || $count <= 0) {
    echo json_encode(['success' => false, 'message' => 'Datos inválidos.']);
    exit;
}

if ($count > 50) {
    echo json_encode(['success' => false, 'message' => 'No se pueden elegir más de 50 números al azar a la vez.']);
    exit;
}

$sellerCode = isset($_GET['seller']) ? strtoupper(trim($_GET['seller'])) : null;

try {
    $sql = "SELECT ticket_number FROM tickets WHERE raffle_id = ? AND status = 'available'";
    $params = [$raffle_id];

    if ($sellerCode !== null && $sellerCode !== '') {
        $sellerStmt = $pdo->prepare("SELECT range_start, range_end FROM sellers WHERE raffle_id = ? AND code = ?");
        $sellerStmt->execute([$raffle_id, $sellerCode]);
        $seller = $sellerStmt->fetch();
        if ($seller) {
            $sql .= " AND ticket_number BETWEEN ? AND ?";
            $params[] = (int)$seller['range_start'];
            $params[] = (int)$seller['range_end'];
        }
    }

    $sql .= " ORDER BY RAND() LIMIT ?";
    $params[] = $count;

    $stmt = $pdo->prepare($sql);
    foreach ($params as $i => $val) {
        $stmt->bindValue($i + 1, $val, PDO::PARAM_INT);
    }
    $stmt->execute();
    $numbers = array_map('intval', array_column($stmt->fetchAll(), 'ticket_number'));

    echo json_encode(['success' => true, 'ticket_numbers' => $numbers]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error del servidor.']);
}
