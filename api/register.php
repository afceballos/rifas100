<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$tenantName = trim($data['tenant_name'] ?? '');
$username = trim($data['username'] ?? '');
$email = trim($data['email'] ?? '');
$password = (string)($data['password'] ?? '');

if ($tenantName === '' || $username === '' || $email === '' || $password === '') {
    echo json_encode(['success' => false, 'message' => 'Completa todos los campos.']);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Correo electrónico inválido.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Ese usuario o correo ya está registrado.']);
        exit;
    }

    $pdo->beginTransaction();

    $stmtTenant = $pdo->prepare("INSERT INTO tenants (name) VALUES (?)");
    $stmtTenant->execute([$tenantName]);
    $tenantId = $pdo->lastInsertId();

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmtUser = $pdo->prepare("INSERT INTO users (tenant_id, role, username, email, password_hash) VALUES (?, 'admin', ?, ?, ?)");
    $stmtUser->execute([$tenantId, $username, $email, $hash]);
    $userId = $pdo->lastInsertId();

    $pdo->commit();

    $_SESSION['admin_id'] = $userId;
    $_SESSION['tenant_id'] = (int)$tenantId;
    $_SESSION['role'] = 'admin';
    $_SESSION['last_activity'] = time();

    echo json_encode(['success' => true, 'message' => 'Cuenta creada exitosamente.']);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'No se pudo crear la cuenta.']);
}
