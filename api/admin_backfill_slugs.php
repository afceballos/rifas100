<?php
// Utilidad de mantenimiento: genera un slug para las rifas creadas antes de
// que existiera esta columna. Se puede entrar a esta URL (ya logueado) las
// veces que haga falta; si no hay rifas sin slug, no hace nada.
require_once 'auth.php';
require_once 'db.php';
require_once 'slug_helper.php';
header('Content-Type: application/json');

require_auth();

try {
    $stmt = $pdo->prepare("SELECT id FROM raffles WHERE slug IS NULL OR slug = ''");
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $updateStmt = $pdo->prepare("UPDATE raffles SET slug = ? WHERE id = ?");
    $updated = 0;
    foreach ($rows as $row) {
        $slug = generate_raffle_slug($pdo);
        $updateStmt->execute([$slug, $row['id']]);
        $updated++;
    }

    echo json_encode(['success' => true, 'updated' => $updated]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al generar los enlaces']);
}
