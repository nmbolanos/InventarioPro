const AjusteCabecera = require('../models/ajusteCabecera');
const AjusteDetalle = require('../models/ajusteDetalle');
const PDFDocument = require('pdfkit');

const buildPdfBuffer = (cabecera, detalles) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('Documento de Ajuste de Productos', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Número de ajuste: ${cabecera.numero_ajuste}`);
    doc.text(`Fecha: ${new Date(cabecera.fecha).toLocaleString('es-EC')}`);
    doc.text(`Estado: ${cabecera.impreso ? 'Impreso y bloqueado' : 'Pendiente de impresión'}`);
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Descripción: ${cabecera.descripcion || ''}`);
    doc.moveDown();

    doc.fontSize(12).text('Detalle', { underline: true });
    doc.moveDown(0.5);

    const startX = 40;
    const widths = [90, 220, 70, 70, 70];
    const headers = ['Código', 'Producto', 'Stock', 'Cantidad', 'Subtotal'];
    let y = doc.y;

    const drawCell = (text, x, yPos, width, height, align = 'left') => {
        doc.rect(x, yPos, width, height).stroke();
        doc.fontSize(9).text(text ?? '', x + 4, yPos + 5, {
            width: width - 8,
            align,
            height: height - 10
        });
    };

    headers.forEach((header, index) => {
        drawCell(header, startX + widths.slice(0, index).reduce((a, b) => a + b, 0), y, widths[index], 24, 'center');
    });

    y += 24;

    detalles.forEach((detalle) => {
        const cantidad = Number(detalle.cantidad || 0);
        const pvp = Number(detalle.pvp || 0);
        const subtotal = Number.isFinite(Number(detalle.subtotal)) ? Number(detalle.subtotal) : Number((pvp * cantidad).toFixed(2));
        const row = [
            detalle.codigo_producto,
            detalle.producto_nombre || detalle.codigo_producto,
            String(detalle.stock_actual ?? ''),
            String(cantidad),
            `$${subtotal.toFixed(2)}`
        ];
        const rowHeight = 24;
        row.forEach((value, index) => {
            drawCell(value, startX + widths.slice(0, index).reduce((a, b) => a + b, 0), y, widths[index], rowHeight, index === 3 || index === 4 ? 'right' : 'left');
        });
        y += rowHeight;
        if (y > 740) {
            doc.addPage();
            y = 40;
        }
    });

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
