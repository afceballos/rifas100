<?php
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$user = trim($data['username'] ?? '');
$pass = trim($data['password'] ?? '');

// Auto-crear admin por defecto si la tabla está vacía (Solo para el MVP)
$stmt = $pdo->query("SELECT COUNT(*) FROM users");
if ($stmt->fetchColumn() == 0) {
    $hash = password_hash('admin123', PASSWORD_DEFAULT);
    $pdo->prepare("INSERT INTO users (tenant_id, username, password_hash, role) VALUES (NULL, ?, ?, 'super_admin')")
        ->execute(['admin', $hash]);
}

$stmt = $pdo->prepare("SELECT id, password_hash FROM users WHERE username = ?");
$stmt->execute([$user]);
$row = $stmt->fetch();

if ($row && password_verify($pass, $row['password_hash'])) {
    // Genera token aleatorio (64 chars hex)
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', time() + 86400 * 30); // 30 días

    $pdo->prepare("INSERT INTO auth_tokens (token, user_id, expires_at) VALUES (?, ?, ?)")
        ->execute([$token, $row['id'], $expires]);

    echo json_encode([
        'success' => true,
        'message' => 'Login exitoso',
        'token'   => $token,
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Usuario o contraseña incorrectos']);
}
