<?php
session_start();
header('Content-Type: application/json');


try {
    // Permite cambiar entre 'paid' (pagado) y 'reserved' (no pagado/pendiente)
    $stmt = $pdo->prepare("UPDATE tickets SET status = ? WHERE raffle_id = ? AND ticket_number = ? AND status != 'available'");
    $stmt->execute([$data['new_status'], $data['raffle_id'], $data['ticket_number']]);
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al actualizar']);
}

