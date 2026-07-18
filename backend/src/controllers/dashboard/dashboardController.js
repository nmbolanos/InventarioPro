const prisma = require('../../config/prisma');

const getDashboard = async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: { stock_actual: 'asc' }
    });

    const totalProductos = productos.length;
    const sinStock = productos.filter(p => Number(p.stock_actual) === 0).length;
    const stockBajo = productos.filter(p => Number(p.stock_actual) > 0 && Number(p.stock_actual) < 5).length;
    const stockOptimo = productos.filter(p => Number(p.stock_actual) >= 5).length;
    const totalUnidades = productos.reduce((acc, p) => acc + Number(p.stock_actual), 0);
    const valorInventario = productos.reduce(
      (acc, p) => acc + (Number(p.stock_actual) * Number(p.costo)), 0
    );

    const topProductos = [...productos]
      .sort((a, b) => Number(b.stock_actual) - Number(a.stock_actual))
      .slice(0, 5)
      .map(p => ({ nombre: p.nombre, stock: Number(p.stock_actual) }));

    const distribucionEstado = [
      { name: 'Stock Crítico', value: sinStock, color: '#dc3545' },
      { name: 'Stock Bajo',    value: stockBajo, color: '#ffc107' },
      { name: 'Stock Óptimo',  value: stockOptimo, color: '#28a745' },
    ];

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
};

const getMovimientosTemporales = async (req, res) => {
  const { agrupacion = 'mes' } = req.query; 
  try {
    const movimientos = await prisma.movimiento_kardex.findMany({
      where: {
        tipo_movimiento: { in: ['COMPRA', 'VENTA'] }
      },
      select: {
        fecha: true,
        tipo_movimiento: true,
        cantidad: true,
        valor_total: true
      },
      orderBy: { fecha: 'asc' }
    });

    const mapaPeriodos = {};

    for (const mov of movimientos) {
      if (!mov.fecha) continue;
      const d = new Date(mov.fecha);
      let periodo = '';
      if (agrupacion === 'semana') {
        const year = d.getFullYear();
        // Aproximación simple ISO week start (monday)
        const day = d.getDay() || 7; 
        d.setHours(-24 * (day - 1));
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const date = String(d.getDate()).padStart(2, '0');
        periodo = `${d.getFullYear()}-${month}-${date}`;
      } else {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        periodo = `${d.getFullYear()}-${month}`;
      }

      if (!mapaPeriodos[periodo]) {
        mapaPeriodos[periodo] = { periodo, compras: 0, ventas: 0 };
      }

      if (mov.tipo_movimiento === 'COMPRA') {
        mapaPeriodos[periodo].compras += Math.abs(Number(mov.cantidad));
      } else if (mov.tipo_movimiento === 'VENTA') {
        mapaPeriodos[periodo].ventas += Math.abs(Number(mov.cantidad));
      }
    }

    const datos = Object.values(mapaPeriodos);

    // Sort again just in case string comparison is needed
    datos.sort((a, b) => a.periodo.localeCompare(b.periodo));

    res.json({ agrupacion, datos });

  } catch (error) {
    console.error('Error en getMovimientosTemporales:', error);
    res.status(500).json({ message: 'Error al obtener movimientos temporales', error: error.message });
  }
};

const getProductosMasVendidos = async (req, res) => {
  try {
    const grouped = await prisma.movimiento_kardex.groupBy({
      by: ['codigo_producto'],
      where: { tipo_movimiento: 'VENTA' },
      _sum: { cantidad: true }
    });

    const withNames = await Promise.all(grouped.map(async (g) => {
      const prod = await prisma.producto.findUnique({ where: { codigo: g.codigo_producto }});
      return {
        nombre: prod ? prod.nombre : g.codigo_producto,
        cantidad: Math.abs(Number(g._sum.cantidad || 0))
      };
    }));

    withNames.sort((a, b) => b.cantidad - a.cantidad);
    const datos = withNames.slice(0, 8);

    res.json({ datos });

  } catch (error) {
    console.error('Error en getProductosMasVendidos:', error);
    res.status(500).json({ message: 'Error al obtener productos más vendidos', error: error.message });
  }
};

module.exports = { getDashboard, getMovimientosTemporales, getProductosMasVendidos };
