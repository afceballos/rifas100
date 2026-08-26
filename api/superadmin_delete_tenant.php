<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

if (!is_super_admin()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$tenant_id = isset($data['tenant_id']) ? (int)$data['tenant_id'] : 0;

if ($tenant_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'ID inválido']);
    exit;
}

// La cuenta original (tenant 1) y la cuenta del super admin que ejecuta la
// acción nunca se pueden eliminar desde aquí.
if ($tenant_id === 1 || $tenant_id === current_tenant_id()) {
    echo json_encode(['success' => false, 'error' => 'No se puede eliminar esta cuenta']);
    exit;
}

try {
    $stmtRaffles = $pdo->prepare("SELECT id, background_image, organizer_photo FROM raffles WHERE tenant_id = ?");
    $stmtRaffles->execute([$tenant_id]);
    $raffles = $stmtRaffles->fetchAll();

    $raffleIds = array_column($raffles, 'id');
    $receipts = [];
    if (!empty($raffleIds)) {
        $placeholders = implode(',', array_fill(0, count($raffleIds), '?'));
        $stmtReceipts = $pdo->prepare("SELECT receipt_image FROM tickets WHERE raffle_id IN ($placeholders) AND receipt_image IS NOT NULL");
        $stmtReceipts->execute($raffleIds);
        $receipts = $stmtReceipts->fetchAll(PDO::FETCH_COLUMN);
    }

    // ON DELETE CASCADE en users, raffles y tickets elimina todo lo asociado al tenant
    $stmt = $pdo->prepare("DELETE FROM tenants WHERE id = ?");
    $stmt->execute([$tenant_id]);

    if ($stmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'error' => 'No se encontró la cuenta']);
        exit;
    }

    $filesToDelete = $receipts;
    foreach ($raffles as $r) {
        if ($r['background_image']) $filesToDelete[] = $r['background_image'];
        if ($r['organizer_photo']) $filesToDelete[] = $r['organizer_photo'];
    }
    foreach ($filesToDelete as $relPath) {
        $path = __DIR__ . '/../' . ltrim($relPath, '/');
        if (is_file($path)) {
            @unlink($path);
        }
    }

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al eliminar la cuenta']);
}
