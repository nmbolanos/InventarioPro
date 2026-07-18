const express = require('express');
const router = express.Router();
const ajusteCabeceraController = require('../controllers/ajustes/ajusteCabeceraController');
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/roles');

router.use(auth);
router.use(checkPermission(['INV_PRODUCTOS']));

router.get('/actual', ajusteCabeceraController.obtenerActual);
router.get('/', ajusteCabeceraController.obtenerTodos);
router.get('/:id', ajusteCabeceraController.obtenerPorId);
router.post('/', ajusteCabeceraController.crear);
router.post('/:id/imprimir', ajusteCabeceraController.imprimir);
router.put('/:id', ajusteCabeceraController.actualizar);
router.delete('/:id', ajusteCabeceraController.eliminar);

module.exports = router;
