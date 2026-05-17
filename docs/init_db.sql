CREATE DATABASE IF NOT EXISTS riego_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE riego_db;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  rol ENUM('OPERADOR', 'SUPERVISOR') NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  ultima_sesion TIMESTAMP NULL,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parcelas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  area_m2 DECIMAL(10,2) NOT NULL CHECK (area_m2 > 0),
  cultivo VARCHAR(50) NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lecturas_sensores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parcela_id INT NOT NULL,
  humedad_suelo DECIMAL(5,2) NOT NULL,
  temperatura_ambiente DECIMAL(5,2) NOT NULL,
  humedad_relativa DECIMAL(5,2) DEFAULT NULL,
  origen ENUM('CSV', 'MANUAL') NOT NULL DEFAULT 'MANUAL',
  es_valida BOOLEAN DEFAULT TRUE,
  usuario_registro INT,
  timestamp_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parcela_id) REFERENCES parcelas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_registro) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE recomendaciones_riego (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parcela_id INT NOT NULL,
  volumen_sugerido_L DECIMAL(8,2) NOT NULL,
  accion ENUM('APLICAR_RIEGO', 'DETENER_RIEGO', 'MANTENER') NOT NULL,
  estado ENUM('PENDIENTE', 'EJECUTADA', 'RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
  urgencia VARCHAR(10) DEFAULT 'BAJO',
  usuario_aprobador INT,
  timestamp_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parcela_id) REFERENCES parcelas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_aprobador) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE config_sistema (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parcela_id INT NOT NULL UNIQUE,
  umbral_min DECIMAL(5,2) NOT NULL DEFAULT 40.00,
  umbral_max DECIMAL(5,2) NOT NULL DEFAULT 80.00,
  kc_actual DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  usuario_responsable INT,
  FOREIGN KEY (parcela_id) REFERENCES parcelas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_responsable) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Datos de prueba
INSERT INTO usuarios (nombre, rol, password_hash) VALUES
('admin', 'SUPERVISOR', 'admin123'),
('operador1', 'OPERADOR', 'operador123');

INSERT INTO parcelas (nombre, area_m2, cultivo) VALUES
('Parcela Norte', 1500.00, 'Maíz'),
('Parcela Sur', 2000.00, 'Trigo'),
('Parcela Este', 1200.00, 'Soya');

INSERT INTO config_sistema (parcela_id, umbral_min, umbral_max, kc_actual) VALUES
(1, 40.00, 80.00, 1.15),
(2, 35.00, 75.00, 1.00),
(3, 45.00, 85.00, 1.20);
