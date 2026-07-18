const express = require('express');
const router  = express.Router();
const { getProductos, getKardex, registrarMovimientos } = require('../controllers/reportes/kardexController');
const { getReporteStock }         = require('../controllers/reportes/reporteStockController');
const auth = require('../middleware/auth');
const apiKeyAuth = require('../middleware/apiKeyAuth');
const { checkPermission } = require('../middleware/roles');

// Endpoint para módulos externos (Compras y Facturación)
// Requiere la llave API definida en EXTERNAL_API_KEY
router.post('/kardex/movimientos', apiKeyAuth, registrarMovimientos);

// A partir de aquí: JWT obligatorio
router.use(auth);

// HU5 — Kardex (requiere permiso INV_KARDEX)
router.get('/kardex/productos',       checkPermission(['INV_KARDEX']), getProductos);
router.get('/kardex/:codigoProducto', checkPermission(['INV_KARDEX']), getKardex);

/**
 * @swagger
 * /api/kardex/movimientos:
 *   post:
 *     summary: Registra una compra o venta y afecta el stock del inventario
 *     tags: [Movimientos y Kardex]
 *     security:
 *       - ApiKeyAuth: []
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
router.get('/stock', checkPermission(['INV_REPORTES']), getReporteStock);

module.exports = router;