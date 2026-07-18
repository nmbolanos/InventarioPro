const prisma = require('../../config/prisma');
const PDFDocument = require('pdfkit');

const buildPdfBuffer = (cabecera, detalles) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Branding Colors
    const primaryColor = '#d10a11';
    const textColor = '#333333';
    const lightGray = '#f9f9f9';
    const borderColor = '#eeeeee';

    // Top Red Bar
    doc.rect(0, 0, doc.page.width, 8).fill(primaryColor);

    // Title
    doc.moveDown(1);
    doc.fontSize(20).fillColor(primaryColor).font('Helvetica-Bold').text('REPORTE DE AJUSTE', { align: 'center', characterSpacing: 1 });
    doc.moveDown(1.5);

    // Meta Data Box
    const startX = 50;
    const boxWidth = doc.page.width - 100;
    
    doc.rect(startX, doc.y, boxWidth, 55).fillAndStroke('#fafafa', '#e0e0e0');
    
    let metaY = doc.y + 12;
    doc.fontSize(10).fillColor(textColor).font('Helvetica-Bold').text('NÚMERO:', startX + 15, metaY);
    doc.font('Helvetica').text(cabecera.numero_ajuste, startX + 75, metaY);
    
    doc.font('Helvetica-Bold').text('FECHA:', startX + 270, metaY);
    doc.font('Helvetica').text(new Date(cabecera.fecha).toLocaleDateString('es-EC'), startX + 320, metaY);
    
    metaY += 20;
    doc.font('Helvetica-Bold').text('MOTIVO:', startX + 15, metaY);
    doc.font('Helvetica').text(cabecera.descripcion || 'Sin descripción', startX + 75, metaY, { width: boxWidth - 90 });

    doc.y = metaY + 35;
    
    // Table Configuration
    const widths = [80, 205, 60, 65, 85];
    const headers = ['CÓDIGO', 'PRODUCTO', 'STOCK', 'CANTIDAD', 'SUBTOTAL'];
    let y = doc.y;

    // Draw Table Header
    doc.rect(startX, y, boxWidth, 25).fill(primaryColor);
    
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    headers.forEach((header, index) => {
        let x = startX + widths.slice(0, index).reduce((a, b) => a + b, 0);
        doc.text(header, x, y + 8, {
            width: widths[index],
            align: index === 1 ? 'left' : 'center',
            indent: index === 1 ? 10 : 0
        });
    });

    y += 25;
    doc.font('Helvetica').fontSize(9);

    let totalSubtotal = 0;

    detalles.forEach((detalle, index) => {
        // Page break logic
        if (y > 720) {
            doc.addPage();
            doc.rect(0, 0, doc.page.width, 8).fill(primaryColor);
            y = 50;
            // Redraw Header
            doc.rect(startX, y, boxWidth, 25).fill(primaryColor);
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
            headers.forEach((h, i) => {
                let x = startX + widths.slice(0, i).reduce((a, b) => a + b, 0);
                doc.text(h, x, y + 8, { width: widths[i], align: i === 1 ? 'left' : 'center', indent: i === 1 ? 10 : 0 });
            });
            y += 25;
            doc.font('Helvetica').fontSize(9);
        }

        // Alternating row background
        if (index % 2 === 0) {
            doc.rect(startX, y, boxWidth, 25).fill(lightGray);
        } else {
            doc.rect(startX, y, boxWidth, 25).fill('#ffffff');
        }

        const cantidad = Number(detalle.cantidad || 0);
        const pvp = Number(detalle.producto?.pvp || 0);
        const subtotal = Number.isFinite(Number(detalle.subtotal)) ? Number(detalle.subtotal) : Number((pvp * Math.abs(cantidad)).toFixed(2));
        totalSubtotal += subtotal;
        
        let cantidadStr = cantidad > 0 ? `+${cantidad}` : `${cantidad}`;
        let cantidadColor = cantidad > 0 ? '#1a7a1a' : '#d10a11'; // Green for positive, Red for negative

        const rowData = [
            { text: detalle.codigo_producto, align: 'center', color: textColor },
            { text: detalle.producto?.nombre || detalle.codigo_producto, align: 'left', color: textColor, padLeft: 10 },
            { text: String(detalle.producto?.stock_actual ?? ''), align: 'center', color: textColor },
            { text: cantidadStr, align: 'center', color: cantidadColor, font: 'Helvetica-Bold' },
            { text: `$${Math.abs(subtotal).toFixed(2)}`, align: 'right', color: textColor, padRight: 10 }
        ];

        rowData.forEach((col, i) => {
            let x = startX + widths.slice(0, i).reduce((a, b) => a + b, 0);
            if (col.font) doc.font(col.font); else doc.font('Helvetica');
            doc.fillColor(col.color);
            doc.text(col.text, x + (col.padLeft || 0), y + 8, {
                width: widths[i] - (col.padRight || 0) - (col.padLeft || 0),
                align: col.align
            });
        });
        
        // Bottom border for the row
        doc.moveTo(startX, y + 25).lineTo(startX + boxWidth, y + 25).strokeColor(borderColor).lineWidth(1).stroke();
        
        y += 25;
    });

    // Subtotal Row
    y += 10;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(textColor);
    doc.text('Total Ajustado:', startX + widths[0] + widths[1] + widths[2], y, { width: widths[3], align: 'right' });
    doc.fillColor(primaryColor).text(`$${Math.abs(totalSubtotal).toFixed(2)}`, startX + widths[0] + widths[1] + widths[2] + widths[3], y, { width: widths[4], align: 'right' });

    // Footer
    doc.moveDown(3);
    doc.font('Helvetica-Oblique').fillColor('#999999').fontSize(8).text('Módulo Inventario UTN - Documento generado automáticamente', { align: 'center' });

    doc.end();
});

const ajusteCabeceraController = {
    obtenerTodos: async (req, res) => {
        try {
            const cabeceras = await prisma.ajuste_cabecera.findMany({
                orderBy: [
                    { fecha: 'desc' },
                    { numero_ajuste: 'desc' }
                ]
            });
            res.json(cabeceras);
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al obtener cabeceras de ajuste', error: error.message });
        }
    },

    obtenerPorId: async (req, res) => {
        try {
            const { id } = req.params;
            const cabecera = await prisma.ajuste_cabecera.findUnique({
                where: { numero_ajuste: id },
                include: {
                    ajuste_detalle: {
                        include: { producto: true },
                        orderBy: { id_detalle: 'asc' }
                    }
                }
            });
            
            if (!cabecera) {
                return res.status(404).json({ mensaje: 'Cabecera de ajuste no encontrada' });
            }

            const detalles = cabecera.ajuste_detalle;
            delete cabecera.ajuste_detalle;

            res.json({ ...cabecera, detalles });
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al obtener la cabecera de ajuste', error: error.message });
        }
    },

    obtenerActual: async (req, res) => {
        try {
            const cabecera = await prisma.ajuste_cabecera.findFirst({
                where: { impreso: false },
                orderBy: [
                    { fecha: 'desc' },
                    { numero_ajuste: 'desc' }
                ],
                include: {
                    ajuste_detalle: {
                        include: { producto: true },
                        orderBy: { id_detalle: 'asc' }
                    }
                }
            });

            if (!cabecera) {
                return res.status(404).json({ mensaje: 'No existe un ajuste pendiente de impresión.' });
            }

            const detalles = cabecera.ajuste_detalle;
            delete cabecera.ajuste_detalle;

            res.json({ ...cabecera, detalles });
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al obtener el ajuste actual', error: error.message });
        }
    },

    crear: async (req, res) => {
        try {
            const { descripcion, fecha, impreso } = req.body;

            if (!descripcion) {
                return res.status(400).json({ mensaje: 'La descripción del ajuste es obligatoria.' });
            }

            const fechaAjuste = fecha ? new Date(fecha) : new Date();
            const hoy = new Date();
            hoy.setHours(23, 59, 59, 999);
            
            if (fechaAjuste > hoy) {
                return res.status(400).json({ mensaje: 'No se pueden registrar ajustes con fechas futuras.' });
            }

            const nuevaCabecera = await prisma.ajuste_cabecera.create({
                data: {
                    descripcion,
                    fecha: fechaAjuste,
                    impreso: impreso ?? false
                }
            });

            res.status(201).json(nuevaCabecera);
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al crear la cabecera de ajuste', error: error.message });
        }
    },

    imprimir: async (req, res) => {
        try {
            const { id } = req.params;

            const cabecera = await prisma.ajuste_cabecera.findUnique({
                where: { numero_ajuste: id },
                include: {
                    ajuste_detalle: {
                        include: { producto: true },
                        orderBy: { id_detalle: 'asc' }
                    }
                }
            });

            if (!cabecera) {
                return res.status(404).json({ mensaje: 'Cabecera de ajuste no encontrada' });
            }

            const buffer = await buildPdfBuffer(cabecera, cabecera.ajuste_detalle);

            if (!cabecera.impreso) {
                await prisma.ajuste_cabecera.update({
                    where: { numero_ajuste: id },
                    data: { impreso: true }
                });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="ajuste-${id}.pdf"`);
            res.send(buffer);
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al generar el PDF del ajuste', error: error.message });
        }
    },

    actualizar: async (req, res) => {
        try {
            const { id } = req.params;
            const { descripcion, fecha, impreso } = req.body;

            if (!descripcion) {
                return res.status(400).json({ mensaje: 'La descripción del ajuste es obligatoria.' });
            }

            const cabeceraExistente = await prisma.ajuste_cabecera.findUnique({ where: { numero_ajuste: id } });
            if (!cabeceraExistente) {
                return res.status(404).json({ mensaje: 'Cabecera de ajuste no encontrada' });
            }
            if (cabeceraExistente.impreso) {
                return res.status(400).json({ mensaje: `El ajuste ${id} ya fue impreso y no puede modificarse.` });
            }

            let fechaAjuste = undefined;
            if (fecha) {
                fechaAjuste = new Date(fecha);
                const hoy = new Date();
                hoy.setHours(23, 59, 59, 999);
                if (fechaAjuste > hoy) {
                    return res.status(400).json({ mensaje: 'No se pueden actualizar ajustes con fechas futuras.' });
                }
            }

            const cabeceraActualizada = await prisma.ajuste_cabecera.update({
                where: { numero_ajuste: id },
                data: {
                    descripcion,
                    fecha: fechaAjuste,
                    impreso: impreso ?? undefined
                }
            });

            res.json(cabeceraActualizada);
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al actualizar la cabecera de ajuste', error: error.message });
        }
    },

    eliminar: async (req, res) => {
        try {
            const { id } = req.params;
            
            await prisma.$transaction(async (tx) => {
                const cabecera = await tx.ajuste_cabecera.findUnique({ where: { numero_ajuste: id } });
                if (!cabecera) {
                    throw new Error('Cabecera de ajuste no encontrada');
                }
                if (cabecera.impreso) {
                    throw new Error(`El ajuste ${id} ya fue impreso y no puede eliminarse.`);
                }

                const detalles = await tx.ajuste_detalle.findMany({ where: { numero_ajuste: id } });

                for (const detalle of detalles) {
                    const prod = await tx.producto.findUnique({ where: { codigo: detalle.codigo_producto } });
                    const nuevoStock = prod.stock_actual - detalle.cantidad;
                    if (nuevoStock < 0) {
                        throw new Error(`No se puede eliminar el ajuste porque el stock de "${prod.nombre}" quedaría en negativo (${nuevoStock}).`);
                    }
                    await tx.producto.update({
                        where: { codigo: detalle.codigo_producto },
                        data: { stock_actual: nuevoStock }
                    });
                }

                await tx.ajuste_cabecera.delete({ where: { numero_ajuste: id } });
            });
            
            res.json({ mensaje: 'Cabecera de ajuste y sus detalles eliminados, y el stock ha sido revertido.' });
        } catch (error) {
            const status = error.message.includes('encontrada') ? 404 : 400;
            res.status(status).json({ mensaje: 'Error al eliminar la cabecera de ajuste', error: error.message });
        }
    }
};

module.exports = ajusteCabeceraController;
