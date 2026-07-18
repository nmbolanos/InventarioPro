const prisma = require('../../config/prisma');

const getReporteStock = async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: { codigo: 'desc' }
    });

    const productosConValor = productos.map(p => ({
      ...p,
      valor_inventario: Number((Number(p.stock_actual) * Number(p.costo)).toFixed(2))
    }));

    const totalProductos  = productosConValor.length;
    const activos         = productosConValor.filter(p => p.estado === 'Activo').length;
    const inactivos       = productosConValor.filter(p => p.estado === 'Inactivo').length;
    const sinStock        = productosConValor.filter(p => Number(p.stock_actual) === 0).length;
    const stockBajo       = productosConValor.filter(p => Number(p.stock_actual) > 0 && Number(p.stock_actual) < 5).length;
    const totalUnidades   = productosConValor.reduce((acc, p) => acc + Number(p.stock_actual), 0);
    const valorTotal      = productosConValor.reduce((acc, p) => acc + Number(p.valor_inventario), 0);

    res.json({
      productos: productosConValor,
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
