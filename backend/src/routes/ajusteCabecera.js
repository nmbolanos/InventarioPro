const express = require('express');
const router = express.Router();
const ajusteCabeceraController = require('../controllers/ajusteCabecera');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

router.use(auth);
router.use(checkRole(['INV_BODEGUERO ', 'INV_SUPERVISOR']));

router.get('/actual', ajusteCabeceraController.obtenerActual);
router.get('/', ajusteCabeceraController.obtenerTodos);
router.get('/:id', ajusteCabeceraController.obtenerPorId);
router.post('/', ajusteCabeceraController.crear);
router.post('/:id/imprimir', ajusteCabeceraController.imprimir);
router.put('/:id', ajusteCabeceraController.actualizar);
router.delete('/:id', ajusteCabeceraController.eliminar);

module.exports = router;
