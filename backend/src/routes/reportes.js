const express = require('express');
const router  = express.Router();
const { getProductos, getKardex } = require('../controllers/kardexController');
const { getReporteStock }         = require('../controllers/reporteStockController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

router.use(auth);
router.use(checkRole(['INV_SUPERVISOR']));

// HU5 — Kardex
router.get('/kardex/productos',       getProductos);
router.get('/kardex/:codigoProducto', getKardex);

// HU6 — Reporte Stock
router.get('/stock', getReporteStock);

module.exports = router;