<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['admin_id'])) { echo json_encode(['success' => false, 'error' => 'No autorizado']); exit; }
require_once 'db.php';

try {
    $stmt = $pdo->query("SELECT id, title, price_per_ticket, draw_date, total_tickets, created_at FROM raffles ORDER BY created_at DESC");
    $raffles = $stmt->fetchAll();
    echo json_encode(['success' => true, 'raffles' => $raffles]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al cargar rifas']);
}
