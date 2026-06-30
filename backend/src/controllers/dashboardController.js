const pool = require('../config/db');

// 1. CONTROLADOR: getDashboard
const getDashboard = async (req, res) => {
  try {
    // Productos con su stock (para semáforo y top productos)
    const productosResult = await pool.query(
      `SELECT codigo, nombre, stock_actual, costo, pvp, estado
       FROM producto
       ORDER BY stock_actual ASC`
    );

    const productos = productosResult.rows;

    // Métricas generales
    const totalProductos = productos.length;
    const sinStock = productos.filter(p => Number(p.stock_actual) === 0).length;
    const stockBajo = productos.filter(p => Number(p.stock_actual) > 0 && Number(p.stock_actual) < 5).length;
    const stockOptimo = productos.filter(p => Number(p.stock_actual) >= 5).length;
    const totalUnidades = productos.reduce((acc, p) => acc + Number(p.stock_actual), 0);
    const valorInventario = productos.reduce(
      (acc, p) => acc + Number(p.stock_actual) * Number(p.costo), 0
    );

    // Top 5 productos con mayor stock (para gráfico de barras)
    const topProductos = [...productos]
      .sort((a, b) => Number(b.stock_actual) - Number(a.stock_actual))
      .slice(0, 5)
      .map(p => ({ nombre: p.nombre, stock: Number(p.stock_actual) }));

    // Distribución por estado (para gráfico de pastel)
    const distribucionEstado = [
      { name: 'Stock Crítico', value: sinStock, color: '#dc3545' },
      { name: 'Stock Bajo',    value: stockBajo, color: '#ffc107' },
      { name: 'Stock Óptimo',  value: stockOptimo, color: '#28a745' },
    ];

    // Lista de productos en alerta (rojo y amarillo) para la tabla semáforo
    const alertasReposicion = productos
      .filter(p => Number(p.stock_actual) < 5)
      .map(p => ({
        codigo: p.codigo,
        nombre: p.nombre,
        stock_actual: Number(p.stock_actual),
        nivel: Number(p.stock_actual) === 0 ? 'critico' : 'bajo',
      }));

    res.json({
      metricas: {
        totalProductos,
        totalUnidades,
        valorInventario: Number(valorInventario.toFixed(2)),
        sinStock,
        stockBajo,
        stockOptimo,
      },
      topProductos,
      distribucionEstado,
      alertasReposicion,
    });

  } catch (error) {
    console.error('Error en getDashboard:', error);
    res.status(500).json({ message: 'Error al obtener datos del dashboard', error: error.message });
  }
}; // 👈 AQUÍ se cierra correctamente getDashboard

// 2. CONTROLADOR: getMovimientosTemporales
const getMovimientosTemporales = async (req, res) => {
  const { agrupacion = 'mes' } = req.query; // 'mes' o 'semana'
  try {
    const formatoFecha = agrupacion === 'semana'
      ? `TO_CHAR(DATE_TRUNC('week', fecha), 'YYYY-MM-DD')`
      : `TO_CHAR(DATE_TRUNC('month', fecha), 'YYYY-MM')`;

    const result = await pool.query(
      `SELECT 
         ${formatoFecha} AS periodo,
         tipo_movimiento,
         SUM(cantidad) AS total_cantidad,
         SUM(valor_total) AS total_valor
       FROM movimiento_kardex
       WHERE tipo_movimiento IN ('COMPRA', 'VENTA')
       GROUP BY periodo, tipo_movimiento
       ORDER BY periodo ASC`
    );

    // Transformar a formato: [{ periodo, compras, ventas }]
    const mapaPeriodos = {};

    result.rows.forEach(row => {
      if (!mapaPeriodos[row.periodo]) {
        mapaPeriodos[row.periodo] = { periodo: row.periodo, compras: 0, ventas: 0 };
      }
      if (row.tipo_movimiento === 'COMPRA') {
        mapaPeriodos[row.periodo].compras = Number(row.total_cantidad);
      } else if (row.tipo_movimiento === 'VENTA') {
        mapaPeriodos[row.periodo].ventas = Number(row.total_cantidad);
      }
    });

    const datos = Object.values(mapaPeriodos);

    res.json({ agrupacion, datos });

  } catch (error) {
    console.error('Error en getMovimientosTemporales:', error);
    res.status(500).json({ message: 'Error al obtener movimientos temporales', error: error.message });
  }
}; // 👈 AQUÍ se cierra correctamente getMovimientosTemporales

// 3. CONTROLADOR: getProductosMasVendidos
const getProductosMasVendidos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         p.codigo,
         p.nombre,
         SUM(mk.cantidad) AS total_vendido
       FROM movimiento_kardex mk
       JOIN producto p ON p.codigo = mk.codigo_producto
       WHERE mk.tipo_movimiento = 'VENTA'
       GROUP BY p.codigo, p.nombre
       ORDER BY total_vendido DESC
       LIMIT 8`
    );

    const datos = result.rows.map(r => ({
      nombre: r.nombre,
      cantidad: Number(r.total_vendido),
    }));

    res.json({ datos });

  } catch (error) {
    console.error('Error en getProductosMasVendidos:', error);
    res.status(500).json({ message: 'Error al obtener productos más vendidos', error: error.message });
  }
}; // 👈 AQUÍ se cierra correctamente getProductosMasVendidos

// Exportación limpia
module.exports = { getDashboard, getMovimientosTemporales, getProductosMasVendidos };