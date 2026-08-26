<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
unset($_SESSION['seller_id'], $_SESSION['seller_raffle_id'], $_SESSION['seller_last_activity']);
header('Content-Type: application/json');
echo json_encode(['success' => true]);
