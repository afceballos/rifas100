<?php
// Evitar iniciar sesión si ya se inició en el archivo padre
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function require_auth() {
    if (!isset($_SESSION['admin_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'No autorizado']);
        exit;
    }

    // Expiración por inactividad estricta (1 hora = 3600 segundos)
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > 3600)) {
        session_unset();
        session_destroy();
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Sesión expirada por inactividad']);
        exit;
    }

    // Renovar la ventana de tiempo si hubo actividad
    $_SESSION['last_activity'] = time();
}
