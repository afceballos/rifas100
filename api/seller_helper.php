<?php
// Valida un rango [start, end] opcional para un vendedor.
// - Si $start y $end son ambos null, el vendedor no tiene rango asignado (puede
//   vender cualquier número de la rifa) y no hay nada que validar.
// - Si solo uno de los dos viene, es un error (hay que dar ambos o ninguno).
// - Si ambos vienen, deben caer dentro de los límites de la rifa y no cruzarse
//   con el rango de otro vendedor existente (excluyendo $excludeId en edición).
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

    return null;
}
