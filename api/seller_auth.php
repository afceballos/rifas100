<?php
// Autenticación para el portal de vendedores — sesión y claves totalmente
// separadas de la del admin ($_SESSION['admin_id']), para que nunca se mezclen.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function require_seller_auth($pdo) {
    if (!isset($_SESSION['seller_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'No autorizado']);
        exit;
    }

    // Expiración por inactividad estricta (1 hora = 3600 segundos)
    if (isset($_SESSION['seller_last_activity']) && (time() - $_SESSION['seller_last_activity'] > 3600)) {
        seller_logout_session();
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Sesión expirada por inactividad']);
        exit;
    }
    $_SESSION['seller_last_activity'] = time();

    // Se revisa en cada request (no solo al iniciar sesión) para que, si el
    // admin apaga el portal a mitad de una sesión activa, deje de funcionar
    // de inmediato.
    $stmt = $pdo->prepare("SELECT seller_portal_enabled FROM raffles WHERE id = ?");
    $stmt->execute([$_SESSION['seller_raffle_id']]);
    $row = $stmt->fetch();

    if (!$row || !$row['seller_portal_enabled']) {
        seller_logout_session();
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'El acceso de vendedores está deshabilitado para esta rifa']);
        exit;
    }
}

function seller_logout_session() {
    unset($_SESSION['seller_id'], $_SESSION['seller_raffle_id'], $_SESSION['seller_last_activity']);
}

function current_seller_id() {
    return (int)($_SESSION['seller_id'] ?? 0);
}

function current_seller_raffle_id() {
    return (int)($_SESSION['seller_raffle_id'] ?? 0);
}
