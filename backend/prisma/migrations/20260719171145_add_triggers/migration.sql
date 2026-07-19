-- ==============================================================================
-- 1. CREACIÓN DE SECUENCIAS
-- ==============================================================================
CREATE SEQUENCE IF NOT EXISTS seq_numero_ajuste START 1;
CREATE SEQUENCE IF NOT EXISTS seq_numero_producto START 1;

-- ==============================================================================
-- 2. FUNCIÓN Y TRIGGER PARA AUTOGENERAR "AJUS-XXXX"
-- ==============================================================================
CREATE OR REPLACE FUNCTION fn_generar_numero_ajuste()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_ajuste IS NULL OR NEW.numero_ajuste = '' THEN
        NEW.numero_ajuste := 'AJUS-' || LPAD(nextval('seq_numero_ajuste')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_asignar_numero_ajuste
BEFORE INSERT ON ajuste_cabecera
FOR EACH ROW
EXECUTE FUNCTION fn_generar_numero_ajuste();

-- ==============================================================================
-- 3. FUNCIÓN Y TRIGGER PARA AUTOGENERAR "PRD-XXXX"
-- ==============================================================================
CREATE OR REPLACE FUNCTION fn_generar_codigo_producto()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
        NEW.codigo := 'PRD-' || LPAD(nextval('seq_numero_producto')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_asignar_codigo_producto
BEFORE INSERT ON producto
FOR EACH ROW
EXECUTE FUNCTION fn_generar_codigo_producto();