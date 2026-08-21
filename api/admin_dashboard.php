<?php
header('Content-Type: application/json');
<<<<<<< HEAD
require_once 'db.php';
require_once 'auth.php';

require_auth();

$raffle_id = (int)($_GET['id'] ?? 0);
if ($raffle_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'ID de rifa inválido']);
    exit;
}

try {
    // Stats por estado
    $stmt = $pdo->prepare("
        SELECT status, COUNT(*) AS total
        FROM tickets
        WHERE raffle_id = ?
        GROUP BY status
    ");
    $stmt->execute([$raffle_id]);
    $rows = $stmt->fetchAll();

    $stats = ['available' => 0, 'reserved' => 0, 'paid' => 0];
    foreach ($rows as $r) {
        $stats[$r['status']] = (int)$r['total'];
    }

    // Dinero recaudado: boletos pagados * precio del boleto
    $stmt = $pdo->prepare("SELECT price_per_ticket FROM raffles WHERE id = ?");
    $stmt->execute([$raffle_id]);
    $raffle = $stmt->fetch();
    $price = $raffle ? (float)$raffle['price_per_ticket'] : 0;
    $money = $stats['paid'] * $price;

    // Compradores (boletos con datos)
    $stmt = $pdo->prepare("
        SELECT ticket_number, buyer_name, buyer_phone, buyer_email, status, updated_at
        FROM tickets
        WHERE raffle_id = ? AND buyer_name IS NOT NULL AND buyer_name <> ''
        ORDER BY updated_at DESC
    ");
    $stmt->execute([$raffle_id]);
=======

if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

require_once 'db.php';

try {
    // Estadísticas
    $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM tickets GROUP BY status");
    $rawStats = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $stats = [
        'available' => $rawStats['available'] ?? 0,
        'reserved' => $rawStats['reserved'] ?? 0,
        'paid' => $rawStats['paid'] ?? 0
    ];

    // Dinero total (solo boletos pagados)
    $stmt = $pdo->query("SELECT SUM(r.price_per_ticket) FROM tickets t JOIN raffles r ON t.raffle_id = r.id WHERE t.status = 'paid'");
    $money = $stmt->fetchColumn() ?: 0;

    // Lista de compradores
    $stmt = $pdo->query("SELECT ticket_number, status, buyer_name, buyer_phone, buyer_email, updated_at FROM tickets WHERE status != 'available' ORDER BY updated_at DESC");
>>>>>>> parent of e50b982 (Arquitectura Multi-tenant SaaS y Landing Page implementada)
    $buyers = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
<<<<<<< HEAD
        'stats'   => $stats,
        'money'   => $money,
        'buyers'  => $buyers,
=======
        'stats' => $stats,
        'money' => $money,
        'buyers' => $buyers
>>>>>>> parent of e50b982 (Arquitectura Multi-tenant SaaS y Landing Page implementada)
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al cargar datos']);
}
