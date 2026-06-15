const AjusteDetalle = require('../models/ajusteDetalle');
const AjusteCabecera = require('../models/ajusteCabecera');
const Producto = require('../models/producto');

const ajusteDetalleController = {
    // Obtener todos los detalles de ajuste
    obtenerTodos: async (req, res) => {
        try {
            const detalles = await AjusteDetalle.obtenerTodos();
            res.json(detalles);
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al obtener detalles de ajuste',
                error: error.message
            });
        }
    },

    // Obtener un detalle por ID
    obtenerPorId: async (req, res) => {
        try {
            const { id } = req.params;
            const detalle = await AjusteDetalle.obtenerPorId(id);
            if (!detalle) {
                return res.status(404).json({ mensaje: 'Detalle de ajuste no encontrado' });
            }
            res.json(detalle);
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al obtener el detalle de ajuste',
                error: error.message
            });
        }
    },

    // Obtener todos los detalles de una cabecera específica
    obtenerPorCabeceraId: async (req, res) => {
        try {
            const { cabeceraId } = req.params;

            // Verificar si la cabecera existe
            const cabecera = await AjusteCabecera.obtenerPorId(cabeceraId);
            if (!cabecera) {
                return res.status(404).json({ mensaje: 'Cabecera de ajuste no encontrada' });
            }

            const detalles = await AjusteDetalle.obtenerPorCabeceraId(cabeceraId);
            res.json(detalles);
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al obtener los detalles de la cabecera',
                error: error.message
            });
        }
    },

    // Crear un nuevo detalle de ajuste (valida stock y actualiza automáticamente)
    crear: async (req, res) => {
        try {
            const { ajuste_cabecera_id, producto_id, cantidad } = req.body;

            // Validaciones básicas
            if (!ajuste_cabecera_id || !producto_id || cantidad === undefined) {
                return res.status(400).json({ mensaje: 'Los campos ajuste_cabecera_id, producto_id y cantidad son obligatorios.' });
            }

            const parsedCantidad = parseInt(cantidad, 10);
            if (isNaN(parsedCantidad) || parsedCantidad === 0) {
                return res.status(400).json({ mensaje: 'La cantidad debe ser un número entero diferente de cero.' });
            }

            // Verificar que la cabecera existe
            const cabecera = await AjusteCabecera.obtenerPorId(ajuste_cabecera_id);
            if (!cabecera) {
                return res.status(404).json({ mensaje: `La cabecera de ajuste con ID ${ajuste_cabecera_id} no existe.` });
            }

            // Verificar que el producto existe
            const producto = await Producto.obtenerPorId(producto_id);
            if (!producto) {
                return res.status(404).json({ mensaje: `El producto con ID ${producto_id} no existe.` });
            }

            // Crear el detalle (dentro de la transacción validará el stock)
            const nuevoDetalle = await AjusteDetalle.crear({
                ajuste_cabecera_id,
                producto_id,
                cantidad: parsedCantidad
            });

            res.status(201).json(nuevoDetalle);
        } catch (error) {
            // Manejar errores de stock insuficiente u otros
            res.status(400).json({
                mensaje: 'No se pudo registrar el detalle de ajuste',
                error: error.message
            });
        }
    },

    // Actualizar un detalle de ajuste (valida stock y actualiza dinámicamente)
    actualizar: async (req, res) => {
        try {
            const { id } = req.params;
            const { producto_id, cantidad } = req.body;

            // Validaciones básicas
            if (!producto_id || cantidad === undefined) {
                return res.status(400).json({ mensaje: 'Los campos producto_id y cantidad son obligatorios.' });
            }

            const parsedCantidad = parseInt(cantidad, 10);
            if (isNaN(parsedCantidad) || parsedCantidad === 0) {
                return res.status(400).json({ mensaje: 'La cantidad debe ser un número entero diferente de cero.' });
            }

            // Verificar si existe el detalle
            const detalleExistente = await AjusteDetalle.obtenerPorId(id);
            if (!detalleExistente) {
                return res.status(404).json({ mensaje: 'Detalle de ajuste no encontrado' });
            }

            // Verificar si el nuevo producto existe
            const producto = await Producto.obtenerPorId(producto_id);
            if (!producto) {
                return res.status(404).json({ mensaje: `El producto con ID ${producto_id} no existe.` });
            }

            const detalleActualizado = await AjusteDetalle.actualizar(id, {
                producto_id,
                cantidad: parsedCantidad
            });

            res.json(detalleActualizado);
        } catch (error) {
            res.status(400).json({
                mensaje: 'No se pudo actualizar el detalle de ajuste',
                error: error.message
            });
        }
    },

    // Eliminar un detalle de ajuste (revierte el stock del producto)
    eliminar: async (req, res) => {
        try {
            const { id } = req.params;

            // Verificar si existe el detalle
            const detalleExistente = await AjusteDetalle.obtenerPorId(id);
            if (!detalleExistente) {
                return res.status(404).json({ mensaje: 'Detalle de ajuste no encontrado' });
            }

            const detalleEliminado = await AjusteDetalle.eliminar(id);

            res.json({
                mensaje: 'Detalle de ajuste eliminado con éxito y stock revertido.',
                detalle: detalleEliminado
            });
        } catch (error) {
            res.status(400).json({
                mensaje: 'No se pudo eliminar el detalle de ajuste',
                error: error.message
            });
        }
    }
};

module.exports = ajusteDetalleController;
