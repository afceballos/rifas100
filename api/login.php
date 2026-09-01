<?php
session_start();
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$user = trim($data['username'] ?? '');
$pass = trim($data['password'] ?? '');

// Auto-crear admin por defecto si la tabla está vacía (Solo para el MVP)
$stmt = $pdo->query("SELECT COUNT(*) FROM users");
if($stmt->fetchColumn() == 0) {
    $hash = password_hash('admin123', PASSWORD_DEFAULT);
    $pdo->query("INSERT INTO users (username, password_hash, role) VALUES ('admin', '$hash', 'super_admin')");
}

// Se permite iniciar sesión con el usuario o con el correo, en el mismo campo.
$stmt = $pdo->prepare("SELECT id, password_hash, tenant_id, role, email, email_verified_at FROM users WHERE username = ? OR email = ?");
$stmt->execute([$user, $user]);
$row = $stmt->fetch();

if ($row && password_verify($pass, $row['password_hash'])) {
    // Las cuentas sin correo (la de bootstrap del MVP, o cuentas creadas antes
    // de este cambio) no quedan bloqueadas por verificación.
    if ($row['email'] !== null && $row['email_verified_at'] === null) {
        echo json_encode(['success' => false, 'code' => 'unverified', 'email' => $row['email'], 'message' => 'Debes verificar tu correo antes de iniciar sesión.']);
        exit;
    }
    $_SESSION['admin_id'] = $row['id'];
    $_SESSION['tenant_id'] = $row['tenant_id'];
    $_SESSION['role'] = $row['role'];
    echo json_encode(['success' => true, 'message' => 'Login exitoso']);
} else {
    echo json_encode(['success' => false, 'message' => 'Usuario o contraseña incorrectos']);
}
