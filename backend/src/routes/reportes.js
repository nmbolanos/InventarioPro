const express = require('express');
const router  = express.Router();
const { getProductos, getKardex } = require('../controllers/kardexController');
const { getReporteStock }         = require('../controllers/reporteStockController');

// HU5 — Kardex
router.get('/kardex/productos',       getProductos);
router.get('/kardex/:codigoProducto', getKardex);

// HU6 — Reporte Stock
router.get('/stock', getReporteStock);

module.exports = router;