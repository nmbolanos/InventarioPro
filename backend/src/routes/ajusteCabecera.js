const express = require('express');
const router = express.Router();
const ajusteCabeceraController = require('../controllers/ajusteCabecera');

router.get('/', ajusteCabeceraController.obtenerTodos);
router.get('/:id', ajusteCabeceraController.obtenerPorId);
router.post('/', ajusteCabeceraController.crear);
router.put('/:id', ajusteCabeceraController.actualizar);
router.delete('/:id', ajusteCabeceraController.eliminar);

module.exports = router;
