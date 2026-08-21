<?php
// Lee el header Authorization: Bearer <token>
function get_bearer_token() {
    $headers = [];
    if (function_exists('getallheaders')) {
        $headers = array_change_key_case(getallheaders(), CASE_LOWER);
    }
    $auth = $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';

    if (preg_match('/Bearer\s+(\S+)/i', $auth, $m)) {
        return $m[1];
    }
    return null;
}

function require_auth() {
    global $pdo;

    $token = get_bearer_token();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'No autorizado: falta token']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT user_id FROM auth_tokens WHERE token = ? AND expires_at > NOW() LIMIT 1");
    $stmt->execute([$token]);
    $row = $stmt->fetch();

    if (!$row) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Token inválido o expirado']);
        exit;
    }

    return (int)$row['user_id'];
}
