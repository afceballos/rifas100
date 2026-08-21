-- Configuración inicial
CREATE DATABASE IF NOT EXISTS u527801383_rifas100 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE u527801383_rifas100;

-- 1. Tabla de Inquilinos (Para futuro SaaS: cada cliente es un tenant)
CREATE TABLE IF NOT EXISTS tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Usuarios del Panel de Control (Soporta Super Admin global y Admin por Rifa)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NULL, -- NULL significa Super Admin global
    role ENUM('super_admin', 'admin') DEFAULT 'admin',
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 3. Configuración de la Rifa
CREATE TABLE IF NOT EXISTS raffles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    price_per_ticket DECIMAL(10,2) NOT NULL,
    draw_date DATETIME NOT NULL,
    digits TINYINT NOT NULL DEFAULT 3,
    total_tickets INT NOT NULL,
    status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status, deleted_at),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 4. Boletos (Grilla)
CREATE TABLE IF NOT EXISTS tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    raffle_id INT NOT NULL,
    ticket_number INT NOT NULL,
    status ENUM('available', 'reserved', 'paid') DEFAULT 'available',
    buyer_name VARCHAR(150),
    buyer_phone VARCHAR(20),
    buyer_email VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_ticket (raffle_id, ticket_number),
    FOREIGN KEY (raffle_id) REFERENCES raffles(id) ON DELETE CASCADE
);

-- ============================================================
-- MIGRACIÓN: agregar columnas nuevas a instalaciones existentes
-- (idempotente: usa INFORMATION_SCHEMA para chequear antes)
-- ============================================================
SET @col_desc := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raffles' AND COLUMN_NAME = 'description');
SET @sql := IF(@col_desc = 0,
  'ALTER TABLE raffles ADD COLUMN description TEXT NULL AFTER title',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_digits := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raffles' AND COLUMN_NAME = 'digits');
SET @sql := IF(@col_digits = 0,
  'ALTER TABLE raffles ADD COLUMN digits TINYINT NOT NULL DEFAULT 3 AFTER description',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_status := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raffles' AND COLUMN_NAME = 'status');
SET @sql := IF(@col_status = 0,
  "ALTER TABLE raffles ADD COLUMN status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft' AFTER digits",
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_del := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raffles' AND COLUMN_NAME = 'deleted_at');
SET @sql := IF(@col_del = 0,
  'ALTER TABLE raffles ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER status',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'raffles' AND INDEX_NAME = 'idx_status');
SET @sql := IF(@idx_exists = 0,
  'ALTER TABLE raffles ADD INDEX idx_status (status, deleted_at)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill: marcar rifas existentes como publicadas (compatibilidad con MVP previo)
UPDATE raffles SET status = 'published' WHERE status = 'draft' AND deleted_at IS NULL AND id IN (
  SELECT id FROM (
    SELECT id FROM raffles WHERE deleted_at IS NULL ORDER BY id ASC LIMIT 1
  ) AS tmp
);

-- ============================================================
-- SEED DE PRUEBA (solo si la tabla está vacía)
-- ============================================================
INSERT IGNORE INTO tenants (id, name) VALUES (1, 'Rifas MVP 1');

INSERT IGNORE INTO raffles (id, tenant_id, title, description, price_per_ticket, draw_date, digits, total_tickets, status)
VALUES (1, 1, 'Gran Sorteo de Fin de Año',
  '¡Participa en nuestro sorteo principal! Premios en efectivo y sorpresas para los ganadores. Cada boleto tiene la misma probabilidad y el sorteo se transmite en vivo.',
  10.00, '2026-12-31 23:59:59', 3, 1000, 'published');
