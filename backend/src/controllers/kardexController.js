const pool = require('../config/db');

// Lista de productos para el selector (HU5)
const getProductos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT codigo, nombre, stock_actual 
       FROM producto 
       ORDER BY nombre ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error en getProductos:', error);
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
};

// Kardex de un producto (HU5)
const getKardex = async (req, res) => {
  const { codigoProducto } = req.params;
  const { fechaInicio, fechaFin } = req.query; // 🆕 recibe fechas por query string

  try {
    // Verificar que el producto existe
    const productoResult = await pool.query(
      `SELECT codigo, nombre, descripcion, graba_iva,
              costo, pvp, estado, stock_actual
       FROM producto
       WHERE codigo = $1`,
      [codigoProducto]
    );

    if (productoResult.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const producto = productoResult.rows[0];

    // Construir filtro de fechas dinámicamente
    const condiciones = ['codigo_producto = $1'];
    const valores = [codigoProducto];

    if (fechaInicio) {
      valores.push(fechaInicio);
      condiciones.push(`fecha >= $${valores.length}::date`);
    }

    if (fechaFin) {
      // Sumamos 1 día para incluir todo el día de la fecha fin
      valores.push(fechaFin);
      condiciones.push(`fecha < ($${valores.length}::date + INTERVAL '1 day')`);
    }

    const whereClause = condiciones.join(' AND ');

    const movimientosResult = await pool.query(
      `SELECT
         id_movimiento,
         fecha,
         tipo_movimiento,
         documento_referencia,
         descripcion,
         cantidad,
         costo_unitario,
         valor_total,
         stock_resultante
       FROM movimiento_kardex
       WHERE ${whereClause}
       ORDER BY fecha ASC, id_movimiento ASC`,
      valores
    );

    const movimientos = movimientosResult.rows;

    // Stock inicial y final
    const stockInicial = movimientos.length > 0
      ? movimientos[0].stock_resultante - movimientos[0].cantidad
      : producto.stock_actual;

    const stockFinal = movimientos.length > 0
      ? movimientos[movimientos.length - 1].stock_resultante
      : producto.stock_actual;

    // Invertir el array para mostrar del más reciente al más antiguo
    movimientos.reverse();

    res.json({
      producto,
      stock_inicial: stockInicial,
      stock_final: stockFinal,
      total_movimientos: movimientos.length,
      // 🆕 devuelve las fechas aplicadas para mostrarlas en el frontend
      filtros: {
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
      },
      movimientos,
    });

  } catch (error) {
    console.error('Error en getKardex:', error);
    res.status(500).json({
      message: 'Error al obtener el kardex',
      error: error.message
    });
  }
};

// Registrar movimientos en lote (Kardex y Actualización de Stock)
const registrarMovimientos = async (req, res) => {
  const { tipoMovimiento, documentoReferencia, fechaMovimiento, detalles } = req.body;
  
  if (!tipoMovimiento || !documentoReferencia || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({ message: 'Faltan campos requeridos o detalles vacíos' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const item of detalles) {
      const { codigoProducto, cantidad, precioVenta, costoUnitario } = item;

      if (!codigoProducto || !cantidad || cantidad <= 0) {
        throw new Error(`Producto o cantidad inválida en el detalle: ${codigoProducto}`);
      }

      // Obtener el producto actual bloqueando la fila para concurrencia
      const productoResult = await client.query(
        'SELECT stock_actual, costo FROM producto WHERE codigo = $1 FOR UPDATE',
        [codigoProducto]
      );

      if (productoResult.rows.length === 0) {
        throw new Error(`Producto con código ${codigoProducto} no encontrado`);
      }

      const producto = productoResult.rows[0];
      let nuevoStock = producto.stock_actual;
      
      let descripcionMov = '';
      
      if (tipoMovimiento === 'COMPRA' || tipoMovimiento === 'DEVOLUCION_VENTA' || tipoMovimiento === 'INGRESO') {
        nuevoStock += cantidad;
        descripcionMov = tipoMovimiento === 'COMPRA' ? 'Ingreso por Compra' : 'Ingreso de Inventario';
      } else if (tipoMovimiento === 'VENTA' || tipoMovimiento === 'DEVOLUCION_COMPRA' || tipoMovimiento === 'EGRESO') {
        if (nuevoStock < cantidad) {
           throw new Error(`Stock insuficiente para el producto ${codigoProducto} (Actual: ${nuevoStock})`);
        }
        nuevoStock -= cantidad;
        descripcionMov = tipoMovimiento === 'VENTA' ? 'Salida por Venta' : 'Egreso de Inventario';
      } else {
        throw new Error(`Tipo de movimiento no soportado: ${tipoMovimiento}`);
      }

      // Usar costo enviado (si es compra) o el costo actual (si es venta)
      const costoAplicar = costoUnitario || precioVenta || producto.costo || 0;
      const valorTotal = costoAplicar * cantidad;
      const fecha = fechaMovimiento ? new Date(fechaMovimiento) : new Date();

      // Insertar en movimiento_kardex
      await client.query(
        `INSERT INTO movimiento_kardex 
         (codigo_producto, fecha, tipo_movimiento, documento_referencia, descripcion, cantidad, costo_unitario, valor_total, stock_resultante)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          codigoProducto,
          fecha,
          tipoMovimiento,
          documentoReferencia,
          item.descripcion || descripcionMov,
          cantidad,
          costoAplicar,
          valorTotal,
          nuevoStock
        ]
      );

      // Actualizar el stock_actual en la tabla producto (y el costo si es una COMPRA)
      if (tipoMovimiento === 'COMPRA' && costoUnitario) {
          await client.query(
            'UPDATE producto SET stock_actual = $1, costo = $2 WHERE codigo = $3',
            [nuevoStock, costoUnitario, codigoProducto]
          );
      } else {
          await client.query(
            'UPDATE producto SET stock_actual = $1 WHERE codigo = $2',
            [nuevoStock, codigoProducto]
          );
      }
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Movimientos registrados y stock actualizado exitosamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al registrar movimientos:', error);
    res.status(500).json({ message: 'Error al procesar la transacción', error: error.message });
  } finally {
    client.release();
  }
};

module.exports = { getProductos, getKardex, registrarMovimientos };