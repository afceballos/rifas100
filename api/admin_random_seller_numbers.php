<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

// Sortea `count` números libres (no asignados por rango ni por sorteo a NINGÚN
// otro vendedor) dentro del rango de la rifa, para previsualizar en el modal
// de "Números aleatorios" antes de guardar el vendedor.

$raffle_id = isset($_GET['raffle_id']) ? (int)$_GET['raffle_id'] : 0;
$count = isset($_GET['count']) ? (int)$_GET['count'] : 0;
$exclude_seller_id = isset($_GET['exclude_seller_id']) && $_GET['exclude_seller_id'] !== '' ? (int)$_GET['exclude_seller_id'] : null;

if ($raffle_id <= 0 || $count <= 0) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

if ($count > 5000) {
    echo json_encode(['success' => false, 'error' => 'No se pueden sortear más de 5000 números a la vez.']);
    exit;
}

assert_raffle_ownership($pdo, $raffle_id);

try {
    $stmtRaffle = $pdo->prepare("SELECT total_tickets, number_start FROM raffles WHERE id = ?");
    $stmtRaffle->execute([$raffle_id]);
    $raffle = $stmtRaffle->fetch();
    if (!$raffle) {
        echo json_encode(['success' => false, 'error' => 'Rifa no encontrada']);
        exit;
    }

    $numberStart = (int)$raffle['number_start'];
    $maxNumber = $numberStart + (int)$raffle['total_tickets'] - 1;

    $taken = [];

    $sqlRanges = "SELECT range_start, range_end FROM sellers WHERE raffle_id = ? AND range_start IS NOT NULL";
    $paramsRanges = [$raffle_id];
    if ($exclude_seller_id !== null) {
        $sqlRanges .= " AND id != ?";
        $paramsRanges[] = $exclude_seller_id;
    }
    $stmtRanges = $pdo->prepare($sqlRanges);
    $stmtRanges->execute($paramsRanges);
    foreach ($stmtRanges->fetchAll() as $r) {
        for ($n = (int)$r['range_start']; $n <= (int)$r['range_end']; $n++) {
            $taken[$n] = true;
        }
    }

    $sqlNums = "SELECT sn.ticket_number FROM seller_numbers sn JOIN sellers s ON s.id = sn.seller_id WHERE s.raffle_id = ?";
    $paramsNums = [$raffle_id];
    if ($exclude_seller_id !== null) {
        $sqlNums .= " AND sn.seller_id != ?";
        $paramsNums[] = $exclude_seller_id;
    }
    $stmtNums = $pdo->prepare($sqlNums);
    $stmtNums->execute($paramsNums);
    foreach ($stmtNums->fetchAll() as $r) {
        $taken[(int)$r['ticket_number']] = true;
    }

    $pool = [];
    for ($n = $numberStart; $n <= $maxNumber; $n++) {
        if (!isset($taken[$n])) {
            $pool[] = $n;
        }
    }

    if ($count > count($pool)) {
        echo json_encode(['success' => false, 'error' => 'No quedan suficientes números libres para asignar (disponibles: ' . count($pool) . ').']);
        exit;
    }

    shuffle($pool);
    $picked = array_slice($pool, 0, $count);
    sort($picked);

    echo json_encode(['success' => true, 'numbers' => array_map('intval', $picked)]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error del servidor']);
}
