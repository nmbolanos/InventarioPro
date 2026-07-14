const express = require('express');
const router  = express.Router();
const { getProductos, getKardex, registrarMovimientos } = require('../controllers/kardexController');
const { getReporteStock }         = require('../controllers/reporteStockController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

// Endpoint para módulos externos (Compras y Facturación)
// Solo requiere JWT válido, NO exige un rol específico de Inventario
router.post('/kardex/movimientos', auth, registrarMovimientos);

// A partir de aquí: JWT + rol INV_SUPERVISOR obligatorio
router.use(auth);
router.use(checkRole(['INV_SUPERVISOR']));

// HU5 — Kardex (solo Supervisor)
router.get('/kardex/productos',       getProductos);
router.get('/kardex/:codigoProducto', getKardex);

/**
 * @swagger
 * /api/kardex/movimientos:
 *   post:
 *     summary: Registra una compra o venta y afecta el stock del inventario
 *     tags: [Movimientos y Kardex]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipoMovimiento
 *               - documentoReferencia
 *               - detalles
 *             properties:
 *               tipoMovimiento:
 *                 type: string
 *                 enum: [COMPRA, VENTA, DEVOLUCION_VENTA, DEVOLUCION_COMPRA]
 *                 description: Define si suma o resta stock
 *               documentoReferencia:
 *                 type: string
 *                 description: Código de la factura o comprobante (e.g., FAC-001)
 *               fechaMovimiento:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha opcional, por defecto es la actual
 *               detalles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - codigoProducto
 *                     - cantidad
 *                   properties:
 *                     codigoProducto:
 *                       type: string
 *                     cantidad:
 *                       type: integer
 *                     precioVenta:
 *                       type: number
 *                     costoUnitario:
 *                       type: number
 *                     descripcion:
 *                       type: string
 *     responses:
 *       200:
 *         description: Movimientos registrados y stock actualizado exitosamente
 *       400:
 *         description: Faltan campos requeridos o detalles vacíos
 *       500:
 *         description: Error al procesar la transacción o stock insuficiente
 */
router.post('/kardex/movimientos',    registrarMovimientos);

// HU6 — Reporte Stock
router.get('/stock', getReporteStock);

module.exports = router;