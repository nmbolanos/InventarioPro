const pool = require('../config/db');

// Reporte de stock de todos los productos (HU6)
const getReporteStock = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         codigo,
         nombre,
         descripcion,
         graba_iva,
         costo,
         pvp,
         estado,
         stock_actual,
         ROUND((stock_actual * costo)::NUMERIC, 2) AS valor_inventario
       FROM producto
       ORDER BY codigo DESC`
    );

    const productos = result.rows;

    // Resumen general
    const totalProductos  = productos.length;
    const activos         = productos.filter(p => p.estado === 'Activo').length;
    const inactivos       = productos.filter(p => p.estado === 'Inactivo').length;
    const sinStock        = productos.filter(p => Number(p.stock_actual) === 0).length;
    const stockBajo       = productos.filter(p => Number(p.stock_actual) > 0 && Number(p.stock_actual) < 5).length;
    const totalUnidades   = productos.reduce((acc, p) => acc + Number(p.stock_actual), 0);
    const valorTotal      = productos.reduce((acc, p) => acc + Number(p.valor_inventario), 0);

    res.json({
      productos,
      resumen: {
        totalProductos,
        activos,
        inactivos,
        sinStock,
        stockBajo,
        totalUnidades,
        valorTotal: Number(valorTotal.toFixed(2)),
      },
    });

  } catch (error) {
    console.error('Error en getReporteStock:', error);
    res.status(500).json({ 
      message: 'Error al obtener reporte de stock', 
      error: error.message 
    });
  }
};

module.exports = { getReporteStock };