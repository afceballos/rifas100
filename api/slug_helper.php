<?php
// Genera un slug aleatorio (solo minúsculas y números) único en la tabla raffles,
// para usarlo como identificador público en vez del id numérico autoincremental.
function generate_raffle_slug($pdo, $length = 24) {
    $chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    $charsLen = strlen($chars);

    for ($attempt = 0; $attempt < 10; $attempt++) {
        $slug = '';
        for ($i = 0; $i < $length; $i++) {
            $slug .= $chars[random_int(0, $charsLen - 1)];
        }

        $stmt = $pdo->prepare("SELECT 1 FROM raffles WHERE slug = ?");
        $stmt->execute([$slug]);
        if (!$stmt->fetch()) {
            return $slug;
        }
    }

    // Fallback extremadamente improbable: añade bytes extra de aleatoriedad
    return $slug . bin2hex(random_bytes(4));
}
