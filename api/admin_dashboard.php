<?php
session_start();
header('Content-Type: application/json');
 catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al cargar datos']);
}

