const express = require('express');
const router = express.Router();
const ajusteDetalleController = require('../controllers/ajustes/ajusteDetalleController');
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/roles');

router.use(auth);
router.use(checkPermission(['INV_PRODUCTOS']));

router.get('/', ajusteDetalleController.obtenerTodos);
router.get('/:id', ajusteDetalleController.obtenerPorId);
router.get('/cabecera/:cabeceraId', ajusteDetalleController.obtenerPorCabeceraId);
router.post('/', ajusteDetalleController.crear);
router.put('/:id', ajusteDetalleController.actualizar);
router.delete('/:id', ajusteDetalleController.eliminar);

module.exports = router;
