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
    email VARCHAR(150) NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ALTER TABLE users ADD COLUMN email VARCHAR(150) NULL UNIQUE;

-- 3. Configuración de la Rifa
CREATE TABLE raffles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(32) NULL,
    tenant_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    background_image VARCHAR(255) NULL,
    payment_info TEXT NULL,
    organizer_name VARCHAR(150) NULL,
    organizer_photo VARCHAR(255) NULL,
    theme_color VARCHAR(20) NOT NULL DEFAULT 'blue',
    number_style VARCHAR(20) NOT NULL DEFAULT 'rounded',
    price_per_ticket DECIMAL(10,2) NOT NULL,
    draw_date DATETIME NOT NULL,
    total_tickets INT NOT NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_slug (slug),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Migración para bases de datos existentes:
-- ALTER TABLE raffles ADD COLUMN slug VARCHAR(32) NULL;
-- ALTER TABLE raffles ADD UNIQUE INDEX unique_slug (slug);
-- Después de aplicar lo anterior, entra una vez (ya logueado) a
-- /api/admin_backfill_slugs.php para generarle slug a las rifas existentes.
-- ALTER TABLE raffles ADD COLUMN is_published TINYINT(1) NOT NULL DEFAULT 1;
-- ALTER TABLE raffles ADD COLUMN description TEXT NULL;
-- ALTER TABLE raffles ADD COLUMN background_image VARCHAR(255) NULL;
-- ALTER TABLE raffles ADD COLUMN payment_info TEXT NULL;
-- ALTER TABLE raffles ADD COLUMN organizer_name VARCHAR(150) NULL;
-- ALTER TABLE raffles ADD COLUMN organizer_photo VARCHAR(255) NULL;
-- ALTER TABLE raffles ADD COLUMN theme_color VARCHAR(20) NOT NULL DEFAULT 'blue';
-- ALTER TABLE raffles ADD COLUMN number_style VARCHAR(20) NOT NULL DEFAULT 'rounded';

-- 4. Boletos (Grilla)
CREATE TABLE tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    raffle_id INT NOT NULL,
    ticket_number INT NOT NULL,
    ticket_code VARCHAR(32) NULL,
    status ENUM('available', 'reserved', 'reviewing', 'paid') DEFAULT 'available',
    buyer_name VARCHAR(150),
    buyer_phone VARCHAR(20),
    buyer_email VARCHAR(150),
    receipt_image VARCHAR(255) NULL,
    admin_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_ticket (raffle_id, ticket_number),
    UNIQUE KEY unique_ticket_code (ticket_code),
    FOREIGN KEY (raffle_id) REFERENCES raffles(id) ON DELETE CASCADE
);

-- ALTER TABLE tickets ADD COLUMN ticket_code VARCHAR(32) NULL;
-- ALTER TABLE tickets ADD UNIQUE INDEX unique_ticket_code (ticket_code);
-- ALTER TABLE tickets MODIFY COLUMN status ENUM('available', 'reserved', 'reviewing', 'paid') DEFAULT 'available';
-- ALTER TABLE tickets ADD COLUMN receipt_image VARCHAR(255) NULL;
-- ALTER TABLE tickets ADD COLUMN admin_notes TEXT NULL;

-- INSERCIÓN DE PRUEBA
INSERT INTO tenants (name) VALUES ('Rifas MVP 1');
INSERT INTO raffles (tenant_id, title, price_per_ticket, draw_date, total_tickets) 
VALUES (1, 'Gran Sorteo de Fin de Año', 10.00, '2026-12-31 23:59:59', 100);
