const pool = require('../config/db');
const Producto = require('./producto');

const AjusteDetalle = {
    // Obtener todos los detalles
    obtenerTodos: async () => {
        const query = `
            SELECT ad.*, p.codigo as producto_codigo, p.nombre as producto_nombre 
            FROM ajuste_detalle ad
            JOIN productos p ON ad.producto_id = p.id
            ORDER BY ad.id ASC
        `;
        const { rows } = await pool.query(query);
        return rows;
    },

    // Obtener detalle por ID
    obtenerPorId: async (id) => {
        const query = `
            SELECT ad.*, p.codigo as producto_codigo, p.nombre as producto_nombre 
            FROM ajuste_detalle ad
            JOIN productos p ON ad.producto_id = p.id
            WHERE ad.id = $1
        `;
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    // Obtener todos los detalles por Cabecera ID
    obtenerPorCabeceraId: async (cabeceraId) => {
        const query = `
            SELECT ad.*, p.codigo as producto_codigo, p.nombre as producto_nombre 
            FROM ajuste_detalle ad
            JOIN productos p ON ad.producto_id = p.id
            WHERE ad.ajuste_cabecera_id = $1
            ORDER BY ad.id ASC
        `;
        const { rows } = await pool.query(query, [cabeceraId]);
        return rows;
    },

    // Crear un detalle (afecta stock automáticamente)
    crear: async (datos) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { ajuste_cabecera_id, producto_id, cantidad } = datos;

            // 1. Validar y actualizar stock del producto
            // Suma la cantidad (que puede ser positiva o negativa) al stock actual
            await Producto.actualizarStockConTransaccion(client, producto_id, cantidad);

            // 2. Insertar el detalle
            const query = `
                INSERT INTO ajuste_detalle (ajuste_cabecera_id, producto_id, cantidad)
                VALUES ($1, $2, $3)
                RETURNING *
            `;
            const { rows } = await client.query(query, [ajuste_cabecera_id, producto_id, cantidad]);

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
    actualizar: async (id, datos) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { producto_id: nuevoProductoId, cantidad: nuevaCantidad } = datos;

            // 1. Obtener el detalle actual para comparar
            const selectDetalleQuery = 'SELECT * FROM ajuste_detalle WHERE id = $1 FOR UPDATE';
            const selectDetalleResult = await client.query(selectDetalleQuery, [id]);
            
            if (selectDetalleResult.rows.length === 0) {
                throw new Error(`Detalle de ajuste con ID ${id} no encontrado.`);
            }

            const detalleAnterior = selectDetalleResult.rows[0];
            const anteriorProductoId = detalleAnterior.producto_id;
            const anteriorCantidad = detalleAnterior.cantidad;

            // 2. Ajustar stocks
            if (anteriorProductoId === nuevoProductoId) {
                // Mismo producto: la diferencia neta que debemos aplicar es: nuevaCantidad - anteriorCantidad
                const diferencia = nuevaCantidad - anteriorCantidad;
                if (diferencia !== 0) {
                    await Producto.actualizarStockConTransaccion(client, nuevoProductoId, diferencia);
                }
            } else {
                // Diferente producto:
                // a) Revertir el stock del producto anterior (restar la cantidad anterior del stock, es decir, sumarle -anteriorCantidad)
                await Producto.actualizarStockConTransaccion(client, anteriorProductoId, -anteriorCantidad);

                // b) Aplicar la nueva cantidad al nuevo producto
                await Producto.actualizarStockConTransaccion(client, nuevoProductoId, nuevaCantidad);
            }

            // 3. Actualizar la fila en ajuste_detalle
            const query = `
                UPDATE ajuste_detalle
                SET producto_id = $1, cantidad = $2, actualizado_en = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *
            `;
            const { rows } = await client.query(query, [nuevoProductoId, nuevaCantidad, id]);

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // Eliminar un detalle (reconvierte el stock al estado original)
    eliminar: async (id) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Obtener el detalle para saber qué revertir
            const selectDetalleQuery = 'SELECT * FROM ajuste_detalle WHERE id = $1 FOR UPDATE';
            const selectDetalleResult = await client.query(selectDetalleQuery, [id]);
            
            if (selectDetalleResult.rows.length === 0) {
                throw new Error(`Detalle de ajuste con ID ${id} no encontrado.`);
            }

            const detalle = selectDetalleResult.rows[0];

            // 2. Revertir el stock (restar la cantidad que fue ajustada)
            // Si sumamos 10 en el ajuste, revertir implica restar 10.
            // Si restamos 5 en el ajuste, revertir implica sumar 5.
            // Por ende, el cambio de stock es -cantidad.
            await Producto.actualizarStockConTransaccion(client, detalle.producto_id, -detalle.cantidad);

            // 3. Eliminar el detalle
            const queryDelete = 'DELETE FROM ajuste_detalle WHERE id = $1 RETURNING *';
            const { rows } = await client.query(queryDelete, [id]);

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
