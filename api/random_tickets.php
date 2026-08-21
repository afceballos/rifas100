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

try {
    $stmt = $pdo->prepare("SELECT ticket_number FROM tickets WHERE raffle_id = ? AND status = 'available' ORDER BY RAND() LIMIT ?");
    $stmt->bindValue(1, $raffle_id, PDO::PARAM_INT);
    $stmt->bindValue(2, $count, PDO::PARAM_INT);
    $stmt->execute();
    $numbers = array_map('intval', array_column($stmt->fetchAll(), 'ticket_number'));

    echo json_encode(['success' => true, 'ticket_numbers' => $numbers]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error del servidor.']);
}
