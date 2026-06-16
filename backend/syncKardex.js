require('dotenv').config({ path: './.env' });
const pool = require('./src/config/db');

async function syncKardex() {
    try {
        const client = await pool.connect();
        console.log('Iniciando sincronización del Kardex para Ajustes...');

        // 1. Encontrar detalles de ajuste que NO están en movimiento_kardex
        const query = `
            SELECT 
                ad.numero_ajuste, 
                ad.codigo_producto, 
                ad.cantidad,
                ac.fecha,
                ac.descripcion,
                p.costo,
                p.stock_actual
            FROM ajuste_detalle ad
            JOIN ajuste_cabecera ac ON ad.numero_ajuste = ac.numero_ajuste
            JOIN producto p ON ad.codigo_producto = p.codigo
            LEFT JOIN movimiento_kardex mk 
                ON mk.documento_referencia = ad.numero_ajuste 
                AND mk.codigo_producto = ad.codigo_producto
            WHERE mk.id_movimiento IS NULL
        `;

        const { rows } = await client.query(query);

        if (rows.length === 0) {
            console.log('No hay ajustes faltantes en el kardex.');
            client.release();
            process.exit(0);
        }

        console.log(`Se encontraron ${rows.length} registros de ajustes faltantes en kardex.`);

        await client.query('BEGIN');

        for (const row of rows) {
            const tipoMovimiento = row.cantidad >= 0 ? 'AJUSTE_INGRESO' : 'AJUSTE_EGRESO';
            const valorTotal = Math.abs(row.cantidad) * row.costo;

            const insertQuery = `
                INSERT INTO movimiento_kardex (
                    codigo_producto, fecha, tipo_movimiento, documento_referencia,
                    descripcion, cantidad, costo_unitario, valor_total, stock_resultante
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `;

            // Nota: Para la migración usamos el stock actual aproximado como stock resultante,
            // ya que estos ajustes YA impactaron el stock en el pasado.
            await client.query(insertQuery, [
                row.codigo_producto,
                row.fecha,
                tipoMovimiento,
                row.numero_ajuste,
                row.descripcion || 'Ajuste de inventario (Migración)',
                row.cantidad,
                row.costo,
                valorTotal,
                row.stock_actual // approximated, it's fine for fixing history
            ]);
            console.log(`Insertado en kardex: ${row.numero_ajuste} - ${row.codigo_producto}`);
        }

        await client.query('COMMIT');
        console.log('Sincronización completada con éxito.');
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Error durante sincronización:', err);
        process.exit(1);
    }
}

syncKardex();
