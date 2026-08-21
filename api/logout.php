<?php
header('Content-Type: application/json');
require_once 'db.php';
require_once 'auth.php';

$token = get_bearer_token();
if ($token) {
    $pdo->prepare("DELETE FROM auth_tokens WHERE token = ?")->execute([$token]);
}

echo json_encode(['success' => true, 'message' => 'Sesión cerrada correctamente']);
