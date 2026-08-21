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

$stmt = $pdo->prepare("SELECT id, password_hash FROM users WHERE username = ?");
$stmt->execute([$user]);
$row = $stmt->fetch();

if ($row && password_verify($pass, $row['password_hash'])) {
    $_SESSION['admin_id'] = $row['id'];
    echo json_encode(['success' => true, 'message' => 'Login exitoso']);
} else {
    echo json_encode(['success' => false, 'message' => 'Usuario o contraseña incorrectos']);
}
