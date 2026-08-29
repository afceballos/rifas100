<?php
// Valida un rango [start, end] opcional para un vendedor.
// - Si $start y $end son ambos null, el vendedor no tiene rango asignado (puede
//   vender cualquier número de la rifa) y no hay nada que validar.
// - Si solo uno de los dos viene, es un error (hay que dar ambos o ninguno).
// - Si ambos vienen, deben caer dentro de los límites de la rifa y no cruzarse
//   con el rango de otro vendedor existente (excluyendo $excludeId en edición)
//   ni con números sueltos asignados por sorteo aleatorio a otro vendedor.
function validate_seller_range($pdo, $raffle_id, $total_tickets, $start, $end, $excludeId = null, $number_start = 0) {
    if ($start === null && $end === null) {
        return null;
    }

    if ($start === null || $end === null) {
        return 'Indica ambos extremos del rango, o déjalos vacíos para no asignar uno.';
    }

    $maxNumber = $number_start + $total_tickets - 1;
    if ($start < $number_start || $end < $number_start || $start > $end || $end > $maxNumber) {
        return 'El rango de números no es válido para esta rifa.';
    }

    $sql = "SELECT name, range_start, range_end FROM sellers WHERE raffle_id = ? AND range_start <= ? AND range_end >= ?";
    $params = [$raffle_id, $end, $start];
    if ($excludeId !== null) {
        $sql .= " AND id != ?";
        $params[] = $excludeId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $conflict = $stmt->fetch();

    if ($conflict) {
        $range = str_pad($conflict['range_start'], 2, '0', STR_PAD_LEFT) . '-' . str_pad($conflict['range_end'], 2, '0', STR_PAD_LEFT);
        return "Ese rango se cruza con el de \"{$conflict['name']}\" ($range).";
    }

    $sqlNums = "
        SELECT sn.ticket_number, s.name
        FROM seller_numbers sn
        JOIN sellers s ON s.id = sn.seller_id
        WHERE s.raffle_id = ? AND sn.ticket_number BETWEEN ? AND ?
    ";
    $paramsNums = [$raffle_id, $start, $end];
    if ($excludeId !== null) {
        $sqlNums .= " AND sn.seller_id != ?";
        $paramsNums[] = $excludeId;
    }
    $stmtNums = $pdo->prepare($sqlNums);
    $stmtNums->execute($paramsNums);
    $conflictNum = $stmtNums->fetch();

    if ($conflictNum) {
        return "El número {$conflictNum['ticket_number']} ya está asignado a \"{$conflictNum['name']}\" (números aleatorios).";
    }

    return null;
}

// Devuelve los números aleatorios asignados a un vendedor (arreglo vacío si no tiene).
function get_seller_numbers($pdo, $seller_id) {
    $stmt = $pdo->prepare("SELECT ticket_number FROM seller_numbers WHERE seller_id = ? ORDER BY ticket_number ASC");
    $stmt->execute([$seller_id]);
    return array_map('intval', array_column($stmt->fetchAll(), 'ticket_number'));
}

// Reemplaza por completo el conjunto de números aleatorios asignado a un vendedor.
function set_seller_numbers($pdo, $seller_id, array $numbers) {
    $pdo->prepare("DELETE FROM seller_numbers WHERE seller_id = ?")->execute([$seller_id]);
    if (empty($numbers)) {
        return;
    }
    $placeholders = implode(',', array_fill(0, count($numbers), '(?, ?)'));
    $params = [];
    foreach ($numbers as $n) {
        $params[] = $seller_id;
        $params[] = $n;
    }
    $pdo->prepare("INSERT INTO seller_numbers (seller_id, ticket_number) VALUES $placeholders")->execute($params);
}

// Valida un conjunto de números (asignación aleatoria) para un vendedor: deben
// caer dentro de los límites de la rifa y no cruzarse con el rango ni los
// números aleatorios de otro vendedor (excluyendo $excludeId en edición).
function validate_seller_numbers($pdo, $raffle_id, $total_tickets, array $numbers, $excludeId = null, $number_start = 0) {
    if (empty($numbers)) {
        return null;
    }

    $maxNumber = $number_start + $total_tickets - 1;
    $numbers = array_values(array_unique(array_map('intval', $numbers)));

    foreach ($numbers as $n) {
        if ($n < $number_start || $n > $maxNumber) {
            return 'Uno de los números elegidos no es válido para esta rifa.';
        }
    }

    $sqlRanges = "SELECT name, range_start, range_end FROM sellers WHERE raffle_id = ? AND range_start IS NOT NULL";
    $paramsRanges = [$raffle_id];
    if ($excludeId !== null) {
        $sqlRanges .= " AND id != ?";
        $paramsRanges[] = $excludeId;
    }
    $stmtRanges = $pdo->prepare($sqlRanges);
    $stmtRanges->execute($paramsRanges);
    foreach ($stmtRanges->fetchAll() as $s) {
        foreach ($numbers as $n) {
            if ($n >= (int)$s['range_start'] && $n <= (int)$s['range_end']) {
                return "El número {$n} ya está asignado a \"{$s['name']}\".";
            }
        }
    }

    $placeholders = implode(',', array_fill(0, count($numbers), '?'));
    $sqlNums = "
        SELECT sn.ticket_number, s.name
        FROM seller_numbers sn
        JOIN sellers s ON s.id = sn.seller_id
        WHERE s.raffle_id = ? AND sn.ticket_number IN ($placeholders)
    ";
    $paramsNums = array_merge([$raffle_id], $numbers);
    if ($excludeId !== null) {
        $sqlNums .= " AND sn.seller_id != ?";
        $paramsNums[] = $excludeId;
    }
    $stmtNums = $pdo->prepare($sqlNums);
    $stmtNums->execute($paramsNums);
    $conflict = $stmtNums->fetch();

    if ($conflict) {
        return "El número {$conflict['ticket_number']} ya está asignado a \"{$conflict['name']}\".";
    }

    return null;
}
