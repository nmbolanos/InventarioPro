const pool = require('../config/db');

const AjusteCabecera = {
    // Obtener todas las cabeceras de ajuste
    obtenerTodos: async () => {
        const query = 'SELECT * FROM ajuste_cabecera ORDER BY fecha DESC, numero_ajuste DESC';
        const { rows } = await pool.query(query);
        return rows;
    },

    // Obtener una cabecera por numero_ajuste
    obtenerPorId: async (numero_ajuste) => {
        const query = 'SELECT * FROM ajuste_cabecera WHERE numero_ajuste = $1';
        const { rows } = await pool.query(query, [numero_ajuste]);
        return rows[0];
    },

    // Obtener la cabecera de ajuste más reciente que aún no fue impresa
    obtenerActual: async () => {
        const query = `
            SELECT *
            FROM ajuste_cabecera
            WHERE impreso = false
            ORDER BY fecha DESC, numero_ajuste DESC
            LIMIT 1
        `;
        const { rows } = await pool.query(query);
        return rows[0];
    },

    // Verificar si una cabecera ya fue impresa
    estaImpreso: async (numero_ajuste) => {
        const query = 'SELECT impreso FROM ajuste_cabecera WHERE numero_ajuste = $1';
        const { rows } = await pool.query(query, [numero_ajuste]);
        return rows[0]?.impreso ?? false;
    },

    // Crear una cabecera de ajuste
    crear: async (datos) => {
        const { descripcion, fecha, impreso } = datos;
        
        // Si no viene fecha, por defecto es hoy/ahora
        const fechaAjuste = fecha || new Date().toISOString();
        const estaImpreso = impreso !== undefined ? impreso : false;

        // El número de ajuste se genera automáticamente mediante el disparador (trigger) en la BD
        const query = `
            INSERT INTO ajuste_cabecera (descripcion, fecha, impreso)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const { rows } = await pool.query(query, [
            descripcion,
            fechaAjuste,
            estaImpreso
        ]);
        return rows[0];
    },

    // Actualizar una cabecera de ajuste (descripcion, fecha, impreso)
    actualizar: async (numero_ajuste, datos) => {
        const { descripcion, fecha, impreso } = datos;
        const estadoActual = await AjusteCabecera.obtenerPorId(numero_ajuste);
        if (estadoActual?.impreso) {
            throw new Error(`El ajuste ${numero_ajuste} ya fue impreso y no puede modificarse.`);
        }
        const query = `
            UPDATE ajuste_cabecera
            SET descripcion = $1, fecha = $2, impreso = $3
            WHERE numero_ajuste = $4
            RETURNING *
        `;
        const { rows } = await pool.query(query, [
            descripcion,
            fecha,
            impreso,
            numero_ajuste
        ]);
        return rows[0];
    },

    // Eliminar una cabecera de ajuste y revertir stocks correspondientes
    eliminar: async (numero_ajuste) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const cabecera = await client.query(
                'SELECT impreso FROM ajuste_cabecera WHERE numero_ajuste = $1 FOR UPDATE',
                [numero_ajuste]
            );

            if (cabecera.rows.length === 0) {
                throw new Error(`Cabecera de ajuste ${numero_ajuste} no encontrada.`);
            }

            if (cabecera.rows[0].impreso) {
                throw new Error(`El ajuste ${numero_ajuste} ya fue impreso y no puede eliminarse.`);
            }

            // 1. Obtener todos los detalles asociados para poder revertir stock
            const queryDetalles = 'SELECT codigo_producto, cantidad FROM ajuste_detalle WHERE numero_ajuste = $1';
            const { rows: detalles } = await client.query(queryDetalles, [numero_ajuste]);

            // 2. Revertir el stock para cada detalle
            for (const detalle of detalles) {
                // Al eliminar, restamos la cantidad original de ajuste (revertir)
                const selectProduct = 'SELECT stock_actual, nombre FROM producto WHERE codigo = $1 FOR UPDATE';
                const productRes = await client.query(selectProduct, [detalle.codigo_producto]);
                if (productRes.rows.length > 0) {
                    const prod = productRes.rows[0];
                    const nuevoStock = prod.stock_actual - detalle.cantidad;
                    if (nuevoStock < 0) {
                        throw new Error(`No se puede eliminar el ajuste porque el stock de "${prod.nombre}" quedaría en negativo (${nuevoStock}).`);
                    }
                    await client.query('UPDATE producto SET stock_actual = $1 WHERE codigo = $2', [nuevoStock, detalle.codigo_producto]);
                }
            }

            // 3. Eliminar la cabecera (los detalles se borrarán automáticamente debido a ON DELETE CASCADE)
            const queryDelete = 'DELETE FROM ajuste_cabecera WHERE numero_ajuste = $1 RETURNING *';
            const { rows: deletedRows } = await client.query(queryDelete, [numero_ajuste]);

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
