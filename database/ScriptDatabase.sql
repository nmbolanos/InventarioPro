-- Script de Base de Datos InventarioPro

-- Crear base de datos (Ejecutar por separado si es necesario)
-- CREATE DATABASE inventario_pro;

-- Tabla de Productos
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Ajuste Cabecera
CREATE TABLE IF NOT EXISTS ajuste_cabecera (
    id SERIAL PRIMARY KEY,
    numero_ajuste VARCHAR(20) UNIQUE NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    motivo VARCHAR(255) NOT NULL,
    observacion TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Ajuste Detalle
CREATE TABLE IF NOT EXISTS ajuste_detalle (
    id SERIAL PRIMARY KEY,
    ajuste_cabecera_id INT NOT NULL REFERENCES ajuste_cabecera(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL, -- Puede ser positiva o negativa
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar algunos productos de prueba
INSERT INTO productos (codigo, nombre, descripcion, precio, stock) VALUES
('PROD-0001', 'Teclado Mecánico RGB', 'Teclado mecánico con switches red', 45.99, 50),
('PROD-0002', 'Mouse Gamer Pro', 'Mouse inalámbrico de 16000 DPI', 29.99, 30),
('PROD-0003', 'Monitor 24" FHD', 'Monitor IPS 144Hz para gaming', 189.99, 15),
('PROD-0004', 'Auriculares 7.1', 'Auriculares con sonido envolvente', 35.50, 0)
ON CONFLICT (codigo) DO NOTHING;