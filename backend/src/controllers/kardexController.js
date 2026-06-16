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

    // Obtener todos los movimientos del kardex ordenados por fecha
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
       WHERE codigo_producto = $1
       ORDER BY fecha ASC, id_movimiento ASC`,
      [codigoProducto]
    );

    const movimientos = movimientosResult.rows;

    // Stock inicial = stock antes del primer movimiento
    // Si no hay movimientos, stock_inicial = stock_actual
    const stockInicial = movimientos.length > 0
      ? movimientos[0].stock_resultante - movimientos[0].cantidad
      : producto.stock_actual;

    // Stock final = stock_resultante del último movimiento
    const stockFinal = movimientos.length > 0
      ? movimientos[movimientos.length - 1].stock_resultante
      : producto.stock_actual;

    res.json({
      producto,
      stock_inicial: stockInicial,
      stock_final: stockFinal,
      total_movimientos: movimientos.length,
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

module.exports = { getProductos, getKardex };