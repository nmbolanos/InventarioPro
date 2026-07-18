const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/roles');
const { 
  getDashboard, 
  getMovimientosTemporales, 
  getProductosMasVendidos 
} = require('../controllers/dashboard/dashboardController');

router.use(auth);
router.use(checkPermission(['INV_REPORTES']));

router.get('/', getDashboard);
router.get('/movimientos-temporales', getMovimientosTemporales);
router.get('/productos-mas-vendidos', getProductosMasVendidos);

module.exports = router;