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
    organizer_phone VARCHAR(20) NULL,
    organizer_email VARCHAR(150) NULL,
    theme_color VARCHAR(20) NOT NULL DEFAULT 'blue',
    number_style VARCHAR(20) NOT NULL DEFAULT 'rounded',
    bg_color VARCHAR(20) NOT NULL DEFAULT 'default',
    allow_seller_selection TINYINT(1) NOT NULL DEFAULT 0,
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
-- ALTER TABLE raffles ADD COLUMN bg_color VARCHAR(20) NOT NULL DEFAULT 'default';
-- ALTER TABLE raffles ADD COLUMN organizer_phone VARCHAR(20) NULL;
-- ALTER TABLE raffles ADD COLUMN organizer_email VARCHAR(150) NULL;
-- ALTER TABLE raffles ADD COLUMN allow_seller_selection TINYINT(1) NOT NULL DEFAULT 0; (ver migración de vendedores más abajo)

-- Migración para bases de datos existentes (aplicar en este orden exacto):
--   1) CREATE TABLE sellers (ver abajo)
--   2) ALTER TABLE raffles ADD COLUMN allow_seller_selection TINYINT(1) NOT NULL DEFAULT 0;
--   3) ALTER TABLE tickets ADD COLUMN seller_id INT NULL;
--   4) ALTER TABLE tickets ADD FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL;
--   5) Si la tabla sellers ya existía con range_start/range_end NOT NULL:
--      ALTER TABLE sellers MODIFY COLUMN range_start INT NULL;
--      ALTER TABLE sellers MODIFY COLUMN range_end INT NULL;

-- 4. Vendedores (rango de números asignado dentro de una rifa; el rango es
-- opcional — si queda NULL, el vendedor puede vender cualquier número)
CREATE TABLE sellers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    raffle_id INT NOT NULL,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(150) NULL,
    range_start INT NULL,
    range_end INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_seller_code (code),
    FOREIGN KEY (raffle_id) REFERENCES raffles(id) ON DELETE CASCADE
);

-- 5. Boletos (Grilla)
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
    seller_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_ticket (raffle_id, ticket_number),
    UNIQUE KEY unique_ticket_code (ticket_code),
    FOREIGN KEY (raffle_id) REFERENCES raffles(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL
);

-- ALTER TABLE tickets ADD COLUMN ticket_code VARCHAR(32) NULL;
-- ALTER TABLE tickets ADD UNIQUE INDEX unique_ticket_code (ticket_code);
-- ALTER TABLE tickets MODIFY COLUMN status ENUM('available', 'reserved', 'reviewing', 'paid') DEFAULT 'available';
-- ALTER TABLE tickets ADD COLUMN receipt_image VARCHAR(255) NULL;
-- ALTER TABLE tickets ADD COLUMN admin_notes TEXT NULL;
-- ALTER TABLE tickets: seller_id, ver migración de vendedores más arriba.

-- INSERCIÓN DE PRUEBA
INSERT INTO tenants (name) VALUES ('Rifas MVP 1');
INSERT INTO raffles (tenant_id, title, price_per_ticket, draw_date, total_tickets) 
VALUES (1, 'Gran Sorteo de Fin de Año', 10.00, '2026-12-31 23:59:59', 100);
