<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json');
require_once 'db.php';
require_once 'mailer.php';

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

    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + 86400);
    $stmtToken = $pdo->prepare("INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)");
    $stmtToken->execute([$userId, $token, $expiresAt]);

    $pdo->commit();

    // La cuenta queda creada pero sin sesión: hay que verificar el correo
    // antes de poder iniciar sesión (ver login.php).
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $verifyUrl = "https://{$host}/verificar-correo?token={$token}";
    send_verification_email($email, $username, $verifyUrl);

    echo json_encode(['success' => true, 'message' => 'Cuenta creada. Revisa tu correo para activarla.', 'requires_verification' => true]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'No se pudo crear la cuenta.']);
}
