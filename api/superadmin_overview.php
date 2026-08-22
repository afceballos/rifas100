<?php
require_once 'auth.php';
require_once 'db.php';
header('Content-Type: application/json');

require_auth();

if (!is_super_admin()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

try {
    $tenants = $pdo->query("SELECT id, name, created_at FROM tenants ORDER BY created_at DESC")->fetchAll();

    $usersByTenant = [];
    $usersRows = $pdo->query("SELECT tenant_id, username, email, role, created_at FROM users WHERE tenant_id IS NOT NULL ORDER BY created_at ASC")->fetchAll();
    foreach ($usersRows as $u) {
        $usersByTenant[$u['tenant_id']][] = [
            'username' => $u['username'],
            'email' => $u['email'],
            'role' => $u['role'],
            'created_at' => $u['created_at'],
        ];
    }

    $rafflesByTenant = [];
    $rafflesRows = $pdo->query("
        SELECT
            r.tenant_id, r.id, r.title, r.slug, r.total_tickets, r.is_published, r.created_at,
            COUNT(CASE WHEN t.status = 'reserved' THEN 1 END) AS reserved_count,
            COUNT(CASE WHEN t.status = 'reviewing' THEN 1 END) AS reviewing_count,
            COUNT(CASE WHEN t.status = 'paid' THEN 1 END) AS paid_count
        FROM raffles r
        LEFT JOIN tickets t ON t.raffle_id = r.id
        GROUP BY r.id
        ORDER BY r.created_at DESC
    ")->fetchAll();
    foreach ($rafflesRows as $r) {
        $rafflesByTenant[$r['tenant_id']][] = [
            'id' => (int)$r['id'],
            'title' => $r['title'],
            'slug' => $r['slug'],
            'total_tickets' => (int)$r['total_tickets'],
            'is_published' => (bool)$r['is_published'],
            'created_at' => $r['created_at'],
            'reserved_count' => (int)$r['reserved_count'],
            'reviewing_count' => (int)$r['reviewing_count'],
            'paid_count' => (int)$r['paid_count'],
        ];
    }

    $result = array_map(function ($t) use ($usersByTenant, $rafflesByTenant) {
        return [
            'id' => (int)$t['id'],
            'name' => $t['name'],
            'created_at' => $t['created_at'],
            'users' => $usersByTenant[$t['id']] ?? [],
            'raffles' => $rafflesByTenant[$t['id']] ?? [],
        ];
    }, $tenants);

    echo json_encode(['success' => true, 'tenants' => $result]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al cargar el resumen']);
}
