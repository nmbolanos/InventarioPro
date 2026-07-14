-- ==============================================================================
-- 1. CREACIÓN DE LA SECUENCIA
-- ==============================================================================
-- Esta secuencia llevará el conteo automático para los ajustes (1, 2, 3...)
CREATE SEQUENCE IF NOT EXISTS seq_numero_ajuste START 1;

-- ==============================================================================
-- 2. CREACIÓN DE TABLAS
-- ==============================================================================

-- Tabla Producto
CREATE TABLE IF NOT EXISTS producto (
    codigo VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    graba_iva BOOLEAN NOT NULL DEFAULT true,
    costo NUMERIC(10, 2) NOT NULL DEFAULT 0,
    pvp NUMERIC(10, 2) NOT NULL DEFAULT 0,
    estado VARCHAR(15) NOT NULL DEFAULT 'Activo', -- 'Activo' o 'Inactivo'
    stock_actual INTEGER NOT NULL DEFAULT 0
);

-- Tabla Ajuste Cabecera
CREATE TABLE IF NOT EXISTS ajuste_cabecera (
    numero_ajuste VARCHAR(20) PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    impreso BOOLEAN DEFAULT false
);

-- Tabla Ajuste Detalle
CREATE TABLE IF NOT EXISTS ajuste_detalle (
    id_detalle SERIAL PRIMARY KEY,
    numero_ajuste VARCHAR(20) REFERENCES ajuste_cabecera(numero_ajuste) ON DELETE CASCADE,
    codigo_producto VARCHAR(50) REFERENCES producto(codigo),
    cantidad INTEGER NOT NULL
);

-- Tabla Movimiento Kardex
CREATE TABLE IF NOT EXISTS movimiento_kardex (
    id_movimiento SERIAL PRIMARY KEY,
    codigo_producto VARCHAR(50) REFERENCES producto(codigo),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tipo_movimiento VARCHAR(20) NOT NULL, -- Ej: 'COMPRA', 'VENTA', 'AJUSTE'
    documento_referencia VARCHAR(50) NOT NULL, -- Ej: 'COMP-001', 'AJUS-0001'
    descripcion VARCHAR(255) NOT NULL,
    cantidad INTEGER NOT NULL, 
    costo_unitario NUMERIC(10, 2) NOT NULL,
    valor_total NUMERIC(10, 2) NOT NULL, 
    stock_resultante INTEGER NOT NULL
);

-- ==============================================================================
-- 3. FUNCIÓN Y TRIGGER PARA AUTOGENERAR "AJUS-XXXX"
-- ==============================================================================

-- Función que formatea el número
CREATE OR REPLACE FUNCTION fn_generar_numero_ajuste()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo genera el número si el backend no envía uno explícitamente
    IF NEW.numero_ajuste IS NULL OR NEW.numero_ajuste = '' THEN
        NEW.numero_ajuste := 'AJUS-' || LPAD(nextval('seq_numero_ajuste')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se dispara antes de insertar la cabecera
CREATE OR REPLACE TRIGGER trg_asignar_numero_ajuste
BEFORE INSERT ON ajuste_cabecera
FOR EACH ROW
EXECUTE FUNCTION fn_generar_numero_ajuste();

-- ==============================================================================
-- 4. FUNCIÓN Y TRIGGER PARA AUTOGENERAR "PRD-XXXX"
-- ==============================================================================

-- Secuencia para el conteo automático de productos (1, 2, 3...)
CREATE SEQUENCE IF NOT EXISTS seq_numero_producto START 1;

-- Función que formatea el código del producto
CREATE OR REPLACE FUNCTION fn_generar_codigo_producto()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo genera el código si el backend no envía uno explícitamente
    IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
        NEW.codigo := 'PRD-' || LPAD(nextval('seq_numero_producto')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se dispara antes de insertar un producto
CREATE OR REPLACE TRIGGER trg_asignar_codigo_producto
BEFORE INSERT ON producto
FOR EACH ROW
EXECUTE FUNCTION fn_generar_codigo_producto();