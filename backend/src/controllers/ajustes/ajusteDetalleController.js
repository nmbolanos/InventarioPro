const prisma = require('../../config/prisma');

const bloquearSiImpreso = async (tx, numeroAjuste) => {
    const cabecera = await tx.ajuste_cabecera.findUnique({
        where: { numero_ajuste: numeroAjuste }
    });

    if (!cabecera) {
        throw new Error(`Cabecera de ajuste ${numeroAjuste} no encontrada.`);
    }

    if (cabecera.impreso) {
        throw new Error(`El ajuste ${numeroAjuste} ya fue impreso y no puede modificarse.`);
    }

    return cabecera;
};

const actualizarStockInterno = async (tx, codigo_producto, cantidad) => {
    const prod = await tx.producto.findUnique({
        where: { codigo: codigo_producto }
    });
    
    if (!prod) {
        throw new Error(`Producto con código ${codigo_producto} no encontrado.`);
    }

    const nuevoStock = prod.stock_actual + cantidad;

    if (nuevoStock < 0) {
        throw new Error(`Stock insuficiente para el producto "${prod.nombre}". Stock actual: ${prod.stock_actual}, ajuste solicitado: ${cantidad}`);
    }

    await tx.producto.update({
        where: { codigo: codigo_producto },
        data: { stock_actual: nuevoStock }
    });

    const costoFinal = Number(prod.costo) || Number(prod.pvp) || 0;

    return { nuevoStock, costo: costoFinal };
};

const ajusteDetalleController = {
    obtenerTodos: async (req, res) => {
        try {
            const detalles = await prisma.ajuste_detalle.findMany({
                include: { producto: true },
                orderBy: { id_detalle: 'asc' }
            });
            res.json(detalles);
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al obtener detalles de ajuste', error: error.message });
        }
    },

    obtenerPorId: async (req, res) => {
        try {
            const { id } = req.params;
            const detalle = await prisma.ajuste_detalle.findUnique({
                where: { id_detalle: parseInt(id, 10) },
                include: { producto: true }
            });
            if (!detalle) {
                return res.status(404).json({ mensaje: 'Detalle de ajuste no encontrado' });
            }
            res.json(detalle);
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al obtener el detalle de ajuste', error: error.message });
        }
    },

    obtenerPorCabeceraId: async (req, res) => {
        try {
            const { cabeceraId } = req.params;
            
            const cabecera = await prisma.ajuste_cabecera.findUnique({ where: { numero_ajuste: cabeceraId } });
            if (!cabecera) {
                return res.status(404).json({ mensaje: 'Cabecera de ajuste no encontrada' });
            }

            const detalles = await prisma.ajuste_detalle.findMany({
                where: { numero_ajuste: cabeceraId },
                include: { producto: true },
                orderBy: { id_detalle: 'asc' }
            });
            res.json(detalles);
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al obtener los detalles de la cabecera', error: error.message });
        }
    },

    crear: async (req, res) => {
        try {
            const { numero_ajuste, codigo_producto, cantidad } = req.body;

            if (!numero_ajuste || !codigo_producto || cantidad === undefined) {
                return res.status(400).json({ mensaje: 'Los campos numero_ajuste, codigo_producto y cantidad son obligatorios.' });
            }

            const parsedCantidad = parseInt(cantidad, 10);
            if (isNaN(parsedCantidad) || parsedCantidad === 0) {
                return res.status(400).json({ mensaje: 'La cantidad debe ser un número entero diferente de cero.' });
            }

            const producto = await prisma.producto.findUnique({ where: { codigo: codigo_producto } });
            if (!producto) {
                return res.status(404).json({ mensaje: `El producto con código ${codigo_producto} no existe.` });
            }

            const nuevoDetalle = await prisma.$transaction(async (tx) => {
                const cabecera = await bloquearSiImpreso(tx, numero_ajuste);
                
                const { nuevoStock, costo } = await actualizarStockInterno(tx, codigo_producto, parsedCantidad);

                const detalle = await tx.ajuste_detalle.create({
                    data: {
                        numero_ajuste,
                        codigo_producto,
                        cantidad: parsedCantidad
                    }
                });

                const tipoMovimiento = parsedCantidad >= 0 ? 'AJUSTE_INGRESO' : 'AJUSTE_EGRESO';
                const valorTotal = Math.abs(parsedCantidad) * costo;

                await tx.movimiento_kardex.create({
                    data: {
                        codigo_producto,
                        fecha: cabecera.fecha,
                        tipo_movimiento: tipoMovimiento,
                        documento_referencia: numero_ajuste,
                        descripcion: cabecera.descripcion || 'Ajuste de inventario',
                        cantidad: parsedCantidad,
                        costo_unitario: costo,
                        valor_total: valorTotal,
                        stock_resultante: nuevoStock
                    }
                });

                return detalle;
            });

            res.status(201).json(nuevoDetalle);
        } catch (error) {
            const status = error.message.includes('no encontrada') ? 404 : 400;
            res.status(status).json({ mensaje: 'No se pudo registrar el detalle de ajuste', error: error.message });
        }
    },

    actualizar: async (req, res) => {
        try {
            const { id } = req.params;
            const { codigo_producto: nuevoCodigo, cantidad } = req.body;

            if (!nuevoCodigo || cantidad === undefined) {
                return res.status(400).json({ mensaje: 'Los campos codigo_producto y cantidad son obligatorios.' });
            }

            const nuevaCantidad = parseInt(cantidad, 10);
            if (isNaN(nuevaCantidad) || nuevaCantidad === 0) {
                return res.status(400).json({ mensaje: 'La cantidad debe ser un número entero diferente de cero.' });
            }

            const idDetalle = parseInt(id, 10);

            const producto = await prisma.producto.findUnique({ where: { codigo: nuevoCodigo } });
            if (!producto) {
                return res.status(404).json({ mensaje: `El producto con código ${nuevoCodigo} no existe.` });
            }

            const detalleActualizado = await prisma.$transaction(async (tx) => {
                const detAnterior = await tx.ajuste_detalle.findUnique({ where: { id_detalle: idDetalle } });
                if (!detAnterior) {
                    throw new Error(`Detalle de ajuste con ID ${idDetalle} no encontrado.`);
                }

                const cabecera = await bloquearSiImpreso(tx, detAnterior.numero_ajuste);
                const anteriorCodigo = detAnterior.codigo_producto;
                const anteriorCantidad = detAnterior.cantidad;

                if (anteriorCodigo === nuevoCodigo) {
                    const diferencia = nuevaCantidad - anteriorCantidad;
                    if (diferencia !== 0) {
                        const { nuevoStock, costo } = await actualizarStockInterno(tx, nuevoCodigo, diferencia);
                        await tx.movimiento_kardex.create({
                            data: {
                                codigo_producto: nuevoCodigo,
                                fecha: new Date(),
                                tipo_movimiento: diferencia >= 0 ? 'AJUSTE_INGRESO' : 'AJUSTE_EGRESO',
                                documento_referencia: detAnterior.numero_ajuste,
                                descripcion: 'Actualización de cantidad de ajuste',
                                cantidad: diferencia,
                                costo_unitario: costo,
                                valor_total: Math.abs(diferencia) * costo,
                                stock_resultante: nuevoStock
                            }
                        });
                    }
                } else {
                    const rev = await actualizarStockInterno(tx, anteriorCodigo, -anteriorCantidad);
                    await tx.movimiento_kardex.create({
                        data: {
                            codigo_producto: anteriorCodigo,
                            fecha: new Date(),
                            tipo_movimiento: 'REVERSO_AJUSTE',
                            documento_referencia: detAnterior.numero_ajuste,
                            descripcion: 'Reverso por cambio de producto en ajuste',
                            cantidad: -anteriorCantidad,
                            costo_unitario: rev.costo,
                            valor_total: Math.abs(anteriorCantidad) * rev.costo,
                            stock_resultante: rev.nuevoStock
                        }
                    });
                    
                    const apl = await actualizarStockInterno(tx, nuevoCodigo, nuevaCantidad);
                    await tx.movimiento_kardex.create({
                        data: {
                            codigo_producto: nuevoCodigo,
                            fecha: cabecera.fecha,
                            tipo_movimiento: nuevaCantidad >= 0 ? 'AJUSTE_INGRESO' : 'AJUSTE_EGRESO',
                            documento_referencia: detAnterior.numero_ajuste,
                            descripcion: cabecera.descripcion || 'Actualización de ajuste',
                            cantidad: nuevaCantidad,
                            costo_unitario: apl.costo,
                            valor_total: Math.abs(nuevaCantidad) * apl.costo,
                            stock_resultante: apl.nuevoStock
                        }
                    });
                }

                return await tx.ajuste_detalle.update({
                    where: { id_detalle: idDetalle },
                    data: { codigo_producto: nuevoCodigo, cantidad: nuevaCantidad }
                });
            });

            res.json(detalleActualizado);
        } catch (error) {
            const status = error.message.includes('no encontrado') ? 404 : 400;
            res.status(status).json({ mensaje: 'No se pudo actualizar el detalle de ajuste', error: error.message });
        }
    },

    eliminar: async (req, res) => {
        try {
            const { id } = req.params;
            const idDetalle = parseInt(id, 10);

            const detalleEliminado = await prisma.$transaction(async (tx) => {
                const detalle = await tx.ajuste_detalle.findUnique({ where: { id_detalle: idDetalle } });
                if (!detalle) {
                    throw new Error(`Detalle de ajuste con ID ${idDetalle} no encontrado.`);
                }

                await bloquearSiImpreso(tx, detalle.numero_ajuste);

                const { nuevoStock, costo } = await actualizarStockInterno(tx, detalle.codigo_producto, -detalle.cantidad);

                const deleted = await tx.ajuste_detalle.delete({ where: { id_detalle: idDetalle } });

                await tx.movimiento_kardex.create({
                    data: {
                        codigo_producto: detalle.codigo_producto,
                        fecha: new Date(),
                        tipo_movimiento: 'REVERSO_AJUSTE',
                        documento_referencia: detalle.numero_ajuste,
                        descripcion: 'Reverso por eliminación de detalle de ajuste',
                        cantidad: -detalle.cantidad,
                        costo_unitario: costo,
                        valor_total: Math.abs(detalle.cantidad) * costo,
                        stock_resultante: nuevoStock
                    }
                });

                return deleted;
            });

            res.json({ mensaje: 'Detalle de ajuste eliminado con éxito y stock revertido.', detalle: detalleEliminado });
        } catch (error) {
            const status = error.message.includes('no encontrado') ? 404 : 400;
            res.status(status).json({ mensaje: 'No se pudo eliminar el detalle de ajuste', error: error.message });
        }
    }
};

module.exports = ajusteDetalleController;
