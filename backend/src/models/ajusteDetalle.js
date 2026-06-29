const pool = require('../config/db');

const bloquearSiImpreso = async (client, numeroAjuste) => {
    const query = 'SELECT * FROM ajuste_cabecera WHERE numero_ajuste = $1 FOR UPDATE';
    const { rows } = await client.query(query, [numeroAjuste]);

    if (rows.length === 0) {
        throw new Error(`Cabecera de ajuste ${numeroAjuste} no encontrada.`);
    }

    if (rows[0].impreso) {
        throw new Error(`El ajuste ${numeroAjuste} ya fue impreso y no puede modificarse.`);
    }

    return rows[0];
};

const AjusteDetalle = {
    // Obtener todos los detalles de ajuste
    obtenerTodos: async () => {
        const query = `
            SELECT ad.*, p.nombre as producto_nombre, p.stock_actual, p.pvp, p.graba_iva
            FROM ajuste_detalle ad
            JOIN producto p ON ad.codigo_producto = p.codigo
            ORDER BY ad.id_detalle ASC
        `;
        const { rows } = await pool.query(query);
        return rows;
    },

    // Obtener un detalle por ID
    obtenerPorId: async (id_detalle) => {
        const query = `
            SELECT ad.*, p.nombre as producto_nombre, p.stock_actual, p.pvp, p.graba_iva
            FROM ajuste_detalle ad
            JOIN producto p ON ad.codigo_producto = p.codigo
            WHERE ad.id_detalle = $1
        `;
        const { rows } = await pool.query(query, [id_detalle]);
        return rows[0];
    },

    // Obtener todos los detalles por número de ajuste
    obtenerPorCabeceraId: async (numero_ajuste) => {
        const query = `
            SELECT ad.*, p.nombre as producto_nombre, p.stock_actual, p.pvp, p.graba_iva
            FROM ajuste_detalle ad
            JOIN producto p ON ad.codigo_producto = p.codigo
            WHERE ad.numero_ajuste = $1
            ORDER BY ad.id_detalle ASC
        `;
        const { rows } = await pool.query(query, [numero_ajuste]);
        return rows;
    },

    // Auxiliar para actualizar stock del producto de forma segura dentro de una transacción
    actualizarStockInterno: async (client, codigo_producto, cantidad) => {
        const selectQuery = 'SELECT stock_actual, nombre, costo, pvp FROM producto WHERE codigo = $1 FOR UPDATE';
        const { rows } = await client.query(selectQuery, [codigo_producto]);
        
        if (rows.length === 0) {
            throw new Error(`Producto con código ${codigo_producto} no encontrado.`);
        }

        const prod = rows[0];
        const nuevoStock = prod.stock_actual + cantidad;

        if (nuevoStock < 0) {
            throw new Error(`Stock insuficiente para el producto "${prod.nombre}". Stock actual: ${prod.stock_actual}, ajuste solicitado: ${cantidad}`);
        }

        const updateQuery = 'UPDATE producto SET stock_actual = $1 WHERE codigo = $2';
        await client.query(updateQuery, [nuevoStock, codigo_producto]);

        // Usar costo del producto; si es null o 0, usar pvp como fallback
        const costoFinal = parseFloat(prod.costo) || parseFloat(prod.pvp) || 0;

        return { nuevoStock, costo: costoFinal };
    },

    // Crear un detalle y actualizar stock
    crear: async (datos) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { numero_ajuste, codigo_producto, cantidad } = datos;

            const cabecera = await bloquearSiImpreso(client, numero_ajuste);

            // 1. Validar e impactar stock
            const { nuevoStock, costo } = await AjusteDetalle.actualizarStockInterno(client, codigo_producto, cantidad);

            // 2. Insertar detalle
            const query = `
                INSERT INTO ajuste_detalle (numero_ajuste, codigo_producto, cantidad)
                VALUES ($1, $2, $3)
                RETURNING *
            `;
            const { rows } = await client.query(query, [numero_ajuste, codigo_producto, cantidad]);

            // 3. Registrar en kardex
            const kardexQuery = `
                INSERT INTO movimiento_kardex (
                    codigo_producto, fecha, tipo_movimiento, documento_referencia,
                    descripcion, cantidad, costo_unitario, valor_total, stock_resultante
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `;
            const tipoMovimiento = cantidad >= 0 ? 'AJUSTE_INGRESO' : 'AJUSTE_EGRESO';
            const valorTotal = Math.abs(cantidad) * costo;

            await client.query(kardexQuery, [
                codigo_producto,
                cabecera.fecha,
                tipoMovimiento,
                numero_ajuste,
                cabecera.descripcion || 'Ajuste de inventario',
                cantidad,
                costo,
                valorTotal,
                nuevoStock
            ]);

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // Actualizar un detalle (recalcula y actualiza stock automáticamente)
    actualizar: async (id_detalle, datos) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { codigo_producto: nuevoCodigo, cantidad: nuevaCantidad } = datos;

            // 1. Obtener detalle actual
            const selectDetalle = 'SELECT * FROM ajuste_detalle WHERE id_detalle = $1 FOR UPDATE';
            const detailRes = await client.query(selectDetalle, [id_detalle]);
            if (detailRes.rows.length === 0) {
                throw new Error(`Detalle de ajuste con ID ${id_detalle} no encontrado.`);
            }

            const detAnterior = detailRes.rows[0];
            const cabecera = await bloquearSiImpreso(client, detAnterior.numero_ajuste);
            const anteriorCodigo = detAnterior.codigo_producto;
            const anteriorCantidad = detAnterior.cantidad;

            const kardexQuery = `
                INSERT INTO movimiento_kardex (
                    codigo_producto, fecha, tipo_movimiento, documento_referencia,
                    descripcion, cantidad, costo_unitario, valor_total, stock_resultante
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `;

            // 2. Ajustar stocks
            if (anteriorCodigo === nuevoCodigo) {
                const diferencia = nuevaCantidad - anteriorCantidad;
                if (diferencia !== 0) {
                    const { nuevoStock, costo } = await AjusteDetalle.actualizarStockInterno(client, nuevoCodigo, diferencia);
                    await client.query(kardexQuery, [
                        nuevoCodigo, new Date().toISOString(), diferencia >= 0 ? 'AJUSTE_INGRESO' : 'AJUSTE_EGRESO',
                        detAnterior.numero_ajuste, 'Actualización de cantidad de ajuste',
                        diferencia, costo, Math.abs(diferencia) * costo, nuevoStock
                    ]);
                }
            } else {
                // Revertir del producto anterior
                const rev = await AjusteDetalle.actualizarStockInterno(client, anteriorCodigo, -anteriorCantidad);
                await client.query(kardexQuery, [
                    anteriorCodigo, new Date().toISOString(), 'REVERSO_AJUSTE', detAnterior.numero_ajuste,
                    'Reverso por cambio de producto en ajuste', -anteriorCantidad, rev.costo, Math.abs(anteriorCantidad) * rev.costo, rev.nuevoStock
                ]);
                
                // Aplicar al nuevo producto
                const apl = await AjusteDetalle.actualizarStockInterno(client, nuevoCodigo, nuevaCantidad);
                await client.query(kardexQuery, [
                    nuevoCodigo, cabecera.fecha, nuevaCantidad >= 0 ? 'AJUSTE_INGRESO' : 'AJUSTE_EGRESO',
                    detAnterior.numero_ajuste, cabecera.descripcion || 'Actualización de ajuste',
                    nuevaCantidad, apl.costo, Math.abs(nuevaCantidad) * apl.costo, apl.nuevoStock
                ]);
            }

            // 3. Actualizar fila
            const query = `
                UPDATE ajuste_detalle
                SET codigo_producto = $1, cantidad = $2
                WHERE id_detalle = $3
                RETURNING *
            `;
            const { rows } = await client.query(query, [nuevoCodigo, nuevaCantidad, id_detalle]);

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // Eliminar un detalle y revertir stock
    eliminar: async (id_detalle) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const selectDetalle = 'SELECT * FROM ajuste_detalle WHERE id_detalle = $1 FOR UPDATE';
            const detailRes = await client.query(selectDetalle, [id_detalle]);
            if (detailRes.rows.length === 0) {
                throw new Error(`Detalle de ajuste con ID ${id_detalle} no encontrado.`);
            }

            const detalle = detailRes.rows[0];
            const cabecera = await bloquearSiImpreso(client, detalle.numero_ajuste);

            // Revertir stock (restar la cantidad aplicada)
            const { nuevoStock, costo } = await AjusteDetalle.actualizarStockInterno(client, detalle.codigo_producto, -detalle.cantidad);

            // Eliminar fila
            const queryDelete = 'DELETE FROM ajuste_detalle WHERE id_detalle = $1 RETURNING *';
            const { rows } = await client.query(queryDelete, [id_detalle]);

            // Revertir en kardex
            const kardexQuery = `
                INSERT INTO movimiento_kardex (
                    codigo_producto, fecha, tipo_movimiento, documento_referencia,
                    descripcion, cantidad, costo_unitario, valor_total, stock_resultante
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `;
            await client.query(kardexQuery, [
                detalle.codigo_producto,
                new Date().toISOString(),
                'REVERSO_AJUSTE',
                detalle.numero_ajuste,
                'Reverso por eliminación de detalle de ajuste',
                -detalle.cantidad,
                costo,
                Math.abs(detalle.cantidad) * costo,
                nuevoStock
            ]);

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};

module.exports = AjusteDetalle;
