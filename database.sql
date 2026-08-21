-- Configuración inicial
CREATE DATABASE IF NOT EXISTS u527801383_rifas100 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE u527801383_rifas100;

-- 1. Tabla de Inquilinos (Para futuro SaaS: cada cliente es un tenant)
CREATE TABLE tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Usuarios del Panel de Control (Soporta Super Admin global y Admin por Rifa)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NULL, -- NULL significa Super Admin global
    role ENUM('super_admin', 'admin') DEFAULT 'admin',
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 3. Configuración de la Rifa
CREATE TABLE raffles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    background_image VARCHAR(255) NULL,
    price_per_ticket DECIMAL(10,2) NOT NULL,
    draw_date DATETIME NOT NULL,
    total_tickets INT NOT NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Migración para bases de datos existentes:
-- ALTER TABLE raffles ADD COLUMN is_published TINYINT(1) NOT NULL DEFAULT 1;
-- ALTER TABLE raffles ADD COLUMN description TEXT NULL;
-- ALTER TABLE raffles ADD COLUMN background_image VARCHAR(255) NULL;

-- 4. Boletos (Grilla)
CREATE TABLE tickets (
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

-- INSERCIÓN DE PRUEBA
INSERT INTO tenants (name) VALUES ('Rifas MVP 1');
INSERT INTO raffles (tenant_id, title, price_per_ticket, draw_date, total_tickets) 
VALUES (1, 'Gran Sorteo de Fin de Año', 10.00, '2026-12-31 23:59:59', 100);
