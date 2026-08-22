<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

$slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';

if ($slug === '') {
    echo json_encode(['success' => false]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, tenant_id FROM raffles WHERE slug = ?");
    $stmt->execute([$slug]);
    $raffle = $stmt->fetch();

    if (!$raffle || (!is_super_admin() && (int)$raffle['tenant_id'] !== current_tenant_id())) {
        echo json_encode(['success' => false]);
        exit;
    }

    echo json_encode(['success' => true, 'raffle_id' => (int)$raffle['id']]);
} catch (Exception $e) {
    echo json_encode(['success' => false]);
}
