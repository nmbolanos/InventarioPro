const express = require('express');
const router = express.Router();
const { 
  getDashboard, 
  getMovimientosTemporales, 
  getProductosMasVendidos 
} = require('../controllers/dashboardController');

router.get('/', getDashboard);
router.get('/movimientos-temporales', getMovimientosTemporales);
router.get('/productos-mas-vendidos', getProductosMasVendidos);

module.exports = router;