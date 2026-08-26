<?php
// Valida que un rango [start, end] esté dentro de los límites de la rifa y no
// se cruce con el rango de otro vendedor existente (excluyendo $excludeId en edición).
function validate_seller_range($pdo, $raffle_id, $total_tickets, $start, $end, $excludeId = null) {
    if ($start < 0 || $end < 0 || $start > $end || $end >= $total_tickets) {
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
