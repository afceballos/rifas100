<?php
header('Content-Type: application/json');
<<<<<<< HEAD
<<<<<<< HEAD
require_once 'db.php';
require_once 'auth.php';

require_auth();
=======
>>>>>>> parent of e50b982 (Arquitectura Multi-tenant SaaS y Landing Page implementada)

=======

>>>>>>> parent of e50b982 (Arquitectura Multi-tenant SaaS y Landing Page implementada)
if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

require_once 'db.php';
$data = json_decode(file_get_contents('php://input'), true);
$new_status    = $data['new_status'] ?? '';
$raffle_id     = (int)($data['raffle_id'] ?? 0);
$ticket_number = (int)($data['ticket_number'] ?? 0);

<<<<<<< HEAD
<<<<<<< HEAD
if (!in_array($new_status, ['paid', 'reserved']) || $raffle_id <= 0 || $ticket_number < 0) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
=======
=======
>>>>>>> parent of e50b982 (Arquitectura Multi-tenant SaaS y Landing Page implementada)
if (!isset($data['ticket_number'])) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos']);
>>>>>>> parent of e50b982 (Arquitectura Multi-tenant SaaS y Landing Page implementada)
    exit;
}

try {
<<<<<<< HEAD
<<<<<<< HEAD
    // Permite cambiar entre 'paid' (pagado) y 'reserved' (no pagado/pendiente)
    $stmt = $pdo->prepare("UPDATE tickets SET status = ? WHERE raffle_id = ? AND ticket_number = ? AND status != 'available'");
    $stmt->execute([$new_status, $raffle_id, $ticket_number]);

    if ($stmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'error' => 'No se encontró el boleto o ya está disponible']);
        exit;
    }

=======
=======
>>>>>>> parent of e50b982 (Arquitectura Multi-tenant SaaS y Landing Page implementada)
    $stmt = $pdo->prepare("UPDATE tickets SET status = 'paid' WHERE ticket_number = ? AND status = 'reserved'");
    $stmt->execute([$data['ticket_number']]);
    
>>>>>>> parent of e50b982 (Arquitectura Multi-tenant SaaS y Landing Page implementada)
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar']);
}
