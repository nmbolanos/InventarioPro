const express = require('express');
const router = express.Router();
const ajusteDetalleController = require('../controllers/ajusteDetalle');

router.get('/', ajusteDetalleController.obtenerTodos);
router.get('/:id', ajusteDetalleController.obtenerPorId);
router.get('/cabecera/:cabeceraId', ajusteDetalleController.obtenerPorCabeceraId);
router.post('/', ajusteDetalleController.crear);
router.put('/:id', ajusteDetalleController.actualizar);
router.delete('/:id', ajusteDetalleController.eliminar);

module.exports = router;
