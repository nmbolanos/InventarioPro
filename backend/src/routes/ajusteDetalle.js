const express = require('express');
const router = express.Router();
const ajusteDetalleController = require('../controllers/ajusteDetalle');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

router.use(auth);
router.use(checkRole(['INV_BODEGUERO ', 'INV_SUPERVISOR']));

router.get('/', ajusteDetalleController.obtenerTodos);
router.get('/:id', ajusteDetalleController.obtenerPorId);
router.get('/cabecera/:cabeceraId', ajusteDetalleController.obtenerPorCabeceraId);
router.post('/', ajusteDetalleController.crear);
router.put('/:id', ajusteDetalleController.actualizar);
router.delete('/:id', ajusteDetalleController.eliminar);

module.exports = router;
