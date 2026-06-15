const pool = require('../config/db');

const AjusteCabecera = {
    // Obtener todas las cabeceras de ajuste
    obtenerTodos: async () => {
        const query = 'SELECT * FROM ajuste_cabecera ORDER BY id DESC';
        const { rows } = await pool.query(query);
        return rows;
    },

    // Obtener una cabecera por ID, incluyendo sus detalles
    obtenerPorId: async (id) => {
        const query = 'SELECT * FROM ajuste_cabecera WHERE id = $1';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    // Generar el siguiente número de ajuste correlativo (ej. AJUS-0001)
    generarSiguienteNumero: async (client) => {
        const queryExecutor = client || pool;
        const query = 'SELECT numero_ajuste FROM ajuste_cabecera ORDER BY id DESC LIMIT 1';
        const { rows } = await queryExecutor.query(query);
        
        let nextNum = 1;
        if (rows.length > 0) {
            const ultimoNumero = rows[0].numero_ajuste;
            const match = ultimoNumero.match(/AJUS-(\d+)/);
            if (match) {
                nextNum = parseInt(match[1], 10) + 1;
            }
        }
        return `AJUS-${String(nextNum).padStart(4, '0')}`;
    },

    // Crear una cabecera de ajuste
    crear: async (datos, client) => {
        const queryExecutor = client || pool;
        const { motivo, observacion, fecha } = datos;
        
        // Si no viene fecha, por defecto es hoy
        const fechaAjuste = fecha || new Date().toISOString().split('T')[0];
        
        // Generar número de ajuste secuencial
        const numero_ajuste = await AjusteCabecera.generarSiguienteNumero(queryExecutor);

        const query = `
            INSERT INTO ajuste_cabecera (numero_ajuste, fecha, motivo, observacion)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const { rows } = await queryExecutor.query(query, [
            numero_ajuste,
            fechaAjuste,
            motivo,
            observacion || null
        ]);
        return rows[0];
    },

    // Actualizar una cabecera de ajuste (solo motivo, observacion, fecha)
    actualizar: async (id, datos) => {
        const { motivo, observacion, fecha } = datos;
        const query = `
            UPDATE ajuste_cabecera
            SET motivo = $1, observacion = $2, fecha = $3, actualizado_en = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
        `;
        const { rows } = await pool.query(query, [
            motivo,
            observacion,
            fecha,
            id
        ]);
        return rows[0];
    },

    // Eliminar una cabecera de ajuste
    // Al eliminar la cabecera, se deben revertir los stocks de todos los detalles asociados
    // antes de eliminarlos físicamente (cascada). Se usa transacción obligatoria.
    eliminar: async (id) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Obtener todos los detalles asociados para poder revertir stock
            const queryDetalles = 'SELECT producto_id, cantidad FROM ajuste_detalle WHERE ajuste_cabecera_id = $1';
            const { rows: detalles } = await client.query(queryDetalles, [id]);

            // 2. Revertir el stock para cada detalle
            const Producto = require('./producto');
            for (const detalle of detalles) {
                // Al eliminar el ajuste, revertimos la acción.
                // Si la cantidad era positiva (+10), al eliminar restamos 10.
                // Si la cantidad era negativa (-5), al eliminar sumamos 5 (revertir restando la cantidad original: stock - cantidad).
                await Producto.actualizarStockConTransaccion(client, detalle.producto_id, -detalle.cantidad);
            }

            // 3. Eliminar la cabecera de ajuste (los detalles se eliminarán automáticamente por ON DELETE CASCADE)
            const queryDelete = 'DELETE FROM ajuste_cabecera WHERE id = $1 RETURNING *';
            const { rows: deletedRows } = await client.query(queryDelete, [id]);

            await client.query('COMMIT');
            return deletedRows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};

module.exports = AjusteCabecera;
