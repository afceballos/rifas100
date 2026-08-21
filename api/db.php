<?php
$host = 'localhost';
$dbname = 'u527801383_rifas100';
$user = 'u527801383_rifas100admin';
$pass = '12345678aF*';

$dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    // Crea la tabla de tokens de auth si no existe (no necesitas correr SQL manual)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS auth_tokens (
            token VARCHAR(64) PRIMARY KEY,
            user_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Migra instalaciones existentes de la tabla de rifas.
    $raffleColumns = $pdo->query("SHOW COLUMNS FROM raffles")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('description', $raffleColumns, true)) {
        $pdo->exec("ALTER TABLE raffles ADD description TEXT NULL AFTER title");
    }
    if (!in_array('digits', $raffleColumns, true)) {
        $pdo->exec("ALTER TABLE raffles ADD digits TINYINT NOT NULL DEFAULT 2 AFTER draw_date");
    }
    if (!in_array('status', $raffleColumns, true)) {
        $pdo->exec("ALTER TABLE raffles ADD status ENUM('draft', 'published') NOT NULL DEFAULT 'published' AFTER total_tickets");
    }
} catch (\PDOException $e) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}
