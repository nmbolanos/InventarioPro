const prisma = require('../../config/prisma');

const getProductos = async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      select: {
        codigo: true,
        nombre: true,
        stock_actual: true
      },
      orderBy: { nombre: 'asc' }
    });
    res.json(productos);
  } catch (error) {
    console.error('Error en getProductos:', error);
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
};

const getKardex = async (req, res) => {
  const { codigoProducto } = req.params;
  const { fechaInicio, fechaFin } = req.query;

  try {
    const producto = await prisma.producto.findUnique({
      where: { codigo: codigoProducto },
      select: {
        codigo: true,
        nombre: true,
        descripcion: true,
        graba_iva: true,
        costo: true,
        pvp: true,
        estado: true,
        stock_actual: true
      }
    });

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const whereClause = { codigo_producto: codigoProducto };

    if (fechaInicio) {
      whereClause.fecha = { ...whereClause.fecha, gte: new Date(fechaInicio) };
    }

    if (fechaFin) {
      const end = new Date(fechaFin);
      end.setDate(end.getDate() + 1); // Sumamos 1 día para incluir todo el día
      whereClause.fecha = { ...whereClause.fecha, lt: end };
    }

    const movimientos = await prisma.movimiento_kardex.findMany({
      where: whereClause,
      select: {
        id_movimiento: true,
        fecha: true,
        tipo_movimiento: true,
        documento_referencia: true,
        descripcion: true,
        cantidad: true,
        costo_unitario: true,
        valor_total: true,
        stock_resultante: true
      },
      orderBy: [
        { fecha: 'desc' },
        { id_movimiento: 'desc' }
      ]
    });

    // In prisma we ordered DESC so the first element is the latest, last is the oldest
    // Reverse it to match previous API format (most recent first? wait, earlier the code did:
    // `ORDER BY fecha ASC, id_movimiento ASC` and then `movimientos.reverse();`
    // So if we query DESC we don't need to reverse it.
    
    // Stock inicial y final
    const stockInicial = movimientos.length > 0
      ? movimientos[movimientos.length - 1].stock_resultante - movimientos[movimientos.length - 1].cantidad
      : producto.stock_actual;

    const stockFinal = movimientos.length > 0
      ? movimientos[0].stock_resultante
      : producto.stock_actual;

    res.json({
      producto,
      stock_inicial: stockInicial,
      stock_final: stockFinal,
      total_movimientos: movimientos.length,
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

const registrarMovimientos = async (req, res) => {
  const { tipoMovimiento, documentoReferencia, fechaMovimiento, detalles } = req.body;
  
  if (!tipoMovimiento || !documentoReferencia || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({ message: 'Faltan campos requeridos o detalles vacíos' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of detalles) {
        const { codigoProducto, cantidad, precioVenta, costoUnitario } = item;

        if (!codigoProducto || !cantidad || cantidad <= 0) {
          throw new Error(`Producto o cantidad inválida en el detalle: ${codigoProducto}`);
        }

        const producto = await tx.producto.findUnique({
          where: { codigo: codigoProducto }
        });

        if (!producto) {
          throw new Error(`Producto con código ${codigoProducto} no encontrado`);
        }

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

        const costoAplicar = Number(costoUnitario) || Number(precioVenta) || Number(producto.costo) || 0;
        const valorTotal = costoAplicar * cantidad;
        const fecha = fechaMovimiento ? new Date(fechaMovimiento) : new Date();

        await tx.movimiento_kardex.create({
          data: {
            codigo_producto: codigoProducto,
            fecha,
            tipo_movimiento: tipoMovimiento,
            documento_referencia: documentoReferencia,
            descripcion: item.descripcion || descripcionMov,
            cantidad,
            costo_unitario: costoAplicar,
            valor_total: valorTotal,
            stock_resultante: nuevoStock
          }
        });

        if (tipoMovimiento === 'COMPRA' && costoUnitario) {
            await tx.producto.update({
              where: { codigo: codigoProducto },
              data: { stock_actual: nuevoStock, costo: costoUnitario }
            });
        } else {
            await tx.producto.update({
              where: { codigo: codigoProducto },
              data: { stock_actual: nuevoStock }
            });
        }
      }
    });

    res.status(200).json({ message: 'Movimientos registrados y stock actualizado exitosamente' });
  } catch (error) {
    console.error('Error al registrar movimientos:', error);
    res.status(500).json({ message: 'Error al procesar la transacción', error: error.message });
  }
};

module.exports = { getProductos, getKardex, registrarMovimientos };
