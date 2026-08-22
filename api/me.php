<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

try {
    $stmt = $pdo->prepare("
        SELECT u.username, u.email, u.role, u.tenant_id, t.name AS tenant_name
        FROM users u
        LEFT JOIN tenants t ON t.id = u.tenant_id
        WHERE u.id = ?
    ");
    $stmt->execute([$_SESSION['admin_id']]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(['success' => false, 'error' => 'Usuario no encontrado']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role'],
        'tenant_id' => $user['tenant_id'] !== null ? (int)$user['tenant_id'] : current_tenant_id(),
        'tenant_name' => $user['tenant_name'],
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al obtener el usuario']);
}
