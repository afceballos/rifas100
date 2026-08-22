<?php
// Genera una cadena aleatoria (solo minúsculas y números) y verifica que sea
// única contra $table.$column antes de devolverla.
function generate_unique_code($pdo, $table, $column, $length = 24) {
    $chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    $charsLen = strlen($chars);

    for ($attempt = 0; $attempt < 10; $attempt++) {
        $code = '';
        for ($i = 0; $i < $length; $i++) {
            $code .= $chars[random_int(0, $charsLen - 1)];
        }

        $stmt = $pdo->prepare("SELECT 1 FROM $table WHERE $column = ?");
        $stmt->execute([$code]);
        if (!$stmt->fetch()) {
            return $code;
        }
    }

    // Fallback extremadamente improbable: añade bytes extra de aleatoriedad
    return $code . bin2hex(random_bytes(4));
}

// Slug público de una rifa (reemplaza el id numérico en /sorteo/:slug).
function generate_raffle_slug($pdo, $length = 24) {
    return generate_unique_code($pdo, 'raffles', 'slug', $length);
}

// Código único de un boleto reservado (usado en /ticket/:code y su QR).
function generate_ticket_code($pdo, $length = 24) {
    return generate_unique_code($pdo, 'tickets', 'ticket_code', $length);
}
