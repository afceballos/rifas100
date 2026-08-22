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

// Cuentas creadas antes de multi-tenant no tienen tenant_id en sesión; se
// asume la 1 (el único tenant que existía) para no romper esa cuenta.
function current_tenant_id() {
    return (int)($_SESSION['tenant_id'] ?? 1);
}

function is_super_admin() {
    return ($_SESSION['role'] ?? '') === 'super_admin';
}

// Verifica que la rifa pedida pertenezca al tenant de la sesión actual (los
// super admin tienen acceso total). Corta la petición con 403 si no.
function assert_raffle_ownership($pdo, $raffle_id) {
    if (is_super_admin()) {
        return;
    }

    $stmt = $pdo->prepare("SELECT tenant_id FROM raffles WHERE id = ?");
    $stmt->execute([$raffle_id]);
    $row = $stmt->fetch();

    if (!$row || (int)$row['tenant_id'] !== current_tenant_id()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No autorizado para esta rifa']);
        exit;
    }
}
