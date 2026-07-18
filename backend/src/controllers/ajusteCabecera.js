const AjusteCabecera = require('../models/ajusteCabecera');
const AjusteDetalle = require('../models/ajusteDetalle');
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
        const pvp = Number(detalle.pvp || 0);
        const subtotal = Number.isFinite(Number(detalle.subtotal)) ? Number(detalle.subtotal) : Number((pvp * cantidad).toFixed(2));
        totalSubtotal += subtotal;
        
        let cantidadStr = cantidad > 0 ? `+${cantidad}` : `${cantidad}`;
        let cantidadColor = cantidad > 0 ? '#1a7a1a' : '#d10a11'; // Green for positive, Red for negative

        const rowData = [
            { text: detalle.codigo_producto, align: 'center', color: textColor },
            { text: detalle.producto_nombre || detalle.codigo_producto, align: 'left', color: textColor, padLeft: 10 },
            { text: String(detalle.stock_actual ?? ''), align: 'center', color: textColor },
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
    // Obtener todas las cabeceras de ajuste
    obtenerTodos: async (req, res) => {
        try {
            const cabeceras = await AjusteCabecera.obtenerTodos();
            res.json(cabeceras);
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al obtener cabeceras de ajuste',
                error: error.message
            });
        }
    },

    // Obtener cabecera por número de ajuste (incluyendo sus detalles)
    obtenerPorId: async (req, res) => {
        try {
            const { id } = req.params; // id representa numero_ajuste (ej: AJUS-0001)
            const cabecera = await AjusteCabecera.obtenerPorId(id);
            
            if (!cabecera) {
                return res.status(404).json({ mensaje: 'Cabecera de ajuste no encontrada' });
            }

            // Obtener los detalles asociados
            const detalles = await AjusteDetalle.obtenerPorCabeceraId(id);
            
            res.json({
                ...cabecera,
                detalles
            });
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al obtener la cabecera de ajuste',
                error: error.message
            });
        }
    },

    obtenerActual: async (req, res) => {
        try {
            const cabecera = await AjusteCabecera.obtenerActual();

            if (!cabecera) {
                return res.status(404).json({ mensaje: 'No existe un ajuste pendiente de impresión.' });
            }

            const detalles = await AjusteDetalle.obtenerPorCabeceraId(cabecera.numero_ajuste);

            res.json({
                ...cabecera,
                detalles
            });
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al obtener el ajuste actual',
                error: error.message
            });
        }
    },

    // Crear una nueva cabecera de ajuste
    crear: async (req, res) => {
        try {
            const { descripcion, fecha, impreso } = req.body;

            // Validación básica
            if (!descripcion) {
                return res.status(400).json({ mensaje: 'La descripción del ajuste es obligatoria.' });
            }

            const nuevaCabecera = await AjusteCabecera.crear({
                descripcion,
                fecha,
                impreso
            });

            res.status(201).json(nuevaCabecera);
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al crear la cabecera de ajuste',
                error: error.message
            });
        }
    },

    imprimir: async (req, res) => {
        try {
            const { id } = req.params;

            const cabecera = await AjusteCabecera.obtenerPorId(id);
            if (!cabecera) {
                return res.status(404).json({ mensaje: 'Cabecera de ajuste no encontrada' });
            }

            const detalles = await AjusteDetalle.obtenerPorCabeceraId(id);
            const buffer = await buildPdfBuffer(cabecera, detalles);

            if (!cabecera.impreso) {
                await AjusteCabecera.actualizar(id, {
                    descripcion: cabecera.descripcion,
                    fecha: cabecera.fecha,
                    impreso: true
                });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="ajuste-${id}.pdf"`);
            res.send(buffer);
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al generar el PDF del ajuste',
                error: error.message
            });
        }
    },

    // Actualizar una cabecera de ajuste
    actualizar: async (req, res) => {
        try {
            const { id } = req.params; // id representa numero_ajuste
            const { descripcion, fecha, impreso } = req.body;

            // Validación básica
            if (!descripcion) {
                return res.status(400).json({ mensaje: 'La descripción del ajuste es obligatoria.' });
            }

            // Verificar si existe la cabecera
            const cabeceraExistente = await AjusteCabecera.obtenerPorId(id);
            if (!cabeceraExistente) {
                return res.status(404).json({ mensaje: 'Cabecera de ajuste no encontrada' });
            }

            const cabeceraActualizada = await AjusteCabecera.actualizar(id, {
                descripcion,
                fecha: fecha || cabeceraExistente.fecha,
                impreso: impreso !== undefined ? impreso : cabeceraExistente.impreso
            });

            res.json(cabeceraActualizada);
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al actualizar la cabecera de ajuste',
                error: error.message
            });
        }
    },

    // Eliminar una cabecera de ajuste (revertirá el stock de sus detalles automáticamente)
    eliminar: async (req, res) => {
        try {
            const { id } = req.params; // id representa numero_ajuste
            
            // Verificar si existe la cabecera
            const cabeceraExistente = await AjusteCabecera.obtenerPorId(id);
            if (!cabeceraExistente) {
                return res.status(404).json({ mensaje: 'Cabecera de ajuste no encontrada' });
            }

            const cabeceraEliminada = await AjusteCabecera.eliminar(id);
            
            res.json({
                mensaje: 'Cabecera de ajuste y sus detalles eliminados, y el stock ha sido revertido.',
                cabecera: cabeceraEliminada
            });
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al eliminar la cabecera de ajuste',
                error: error.message
            });
        }
    }
};

module.exports = ajusteCabeceraController;
