-- 1. Insertar Productos (Variedad: Con/Sin IVA, Activos/Inactivos, Diferentes costos)
INSERT INTO producto (codigo, nombre, descripcion, graba_iva, costo, pvp, estado, stock_actual) VALUES
('PRD-001', 'Laptop Dell XPS 13', 'Laptop i7 16GB RAM', true, 850.00, 1200.00, 'Activo', 10),
('PRD-002', 'Mouse Inalámbrico Logitech', 'Mouse ergonómico', true, 15.00, 25.00, 'Activo', 45),
('PRD-003', 'Licencia Office 365', 'Suscripción anual digital', false, 40.00, 65.00, 'Activo', 100),
('PRD-004', 'Teclado Mecánico RGB', 'Teclado gamer switches blue', true, 45.00, 80.00, 'Inactivo', 0),
('PRD-005', 'Monitor Samsung 24 pulgadas', 'Monitor Full HD 75Hz', true, 110.00, 160.00, 'Activo', 8);

-- 2. Insertar Cabeceras de Ajuste (Variedad: Impreso true/false)
-- Nota: Pasamos el código explícito para poder usarlo como llave foránea en los detalles
INSERT INTO ajuste_cabecera (numero_ajuste, descripcion, fecha, impreso) VALUES
('AJUS-0001', 'Ajuste por inventario inicial (Apertura)', '2026-06-01 08:00:00', true),
('AJUS-0002', 'Ajuste por mercadería con daños de fábrica', CURRENT_TIMESTAMP, false);

-- 3. Insertar Detalles de Ajuste (Variedad: Ingresos positivos y Egresos negativos)
INSERT INTO ajuste_detalle (numero_ajuste, codigo_producto, cantidad) VALUES
('AJUS-0001', 'PRD-001', 10),
('AJUS-0001', 'PRD-002', 50),
('AJUS-0002', 'PRD-005', -2),
('AJUS-0002', 'PRD-004', -5);

-- 4. Insertar Movimientos en el Kardex (Variedad: COMPRA, VENTA, AJUSTE)
INSERT INTO movimiento_kardex (codigo_producto, fecha, tipo_movimiento, documento_referencia, descripcion, cantidad, costo_unitario, valor_total, stock_resultante) VALUES
('PRD-001', '2026-06-05 10:30:00', 'COMPRA', 'COMP-101', 'FACT. COMPRA 101 - Proveedor X', 12, 850.00, 10200.00, 12),
('PRD-001', '2026-06-08 14:15:00', 'VENTA', 'FACT-001-001-000000001', 'FACT. VENTA 001 - Cliente Y', -2, 850.00, -1700.00, 10),
('PRD-003', '2026-06-10 09:00:00', 'COMPRA', 'COMP-102', 'FACT. COMPRA 102 - Microsoft', 100, 40.00, 4000.00, 100),
('PRD-002', '2026-06-11 11:20:00', 'VENTA', 'FACT-001-001-000000002', 'FACT. VENTA 002 - Cliente Z', -5, 15.00, -75.00, 45),
('PRD-005', '2026-06-13 16:45:00', 'AJUSTE', 'AJUS-0002', 'AJUSTE POR DAÑO EN BODEGA', -2, 110.00, -220.00, 8);

-- 5. Sincronizar secuencia del número de ajuste
SELECT setval('seq_numero_ajuste', COALESCE((SELECT MAX(CAST(SUBSTRING(numero_ajuste FROM 6) AS INTEGER)) FROM ajuste_cabecera), 1), true);