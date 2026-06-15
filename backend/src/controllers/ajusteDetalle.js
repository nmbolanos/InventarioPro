const AjusteDetalle = require('../models/ajusteDetalle');
const AjusteCabecera = require('../models/ajusteCabecera');
const Producto = require('../models/Producto'); // Importamos el Producto del HU1

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
            const { id } = req.params; // id representa id_detalle
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

    // Obtener todos los detalles de una cabecera específica (por numero_ajuste)
    obtenerPorCabeceraId: async (req, res) => {
        try {
            const { cabeceraId } = req.params; // cabeceraId representa numero_ajuste (ej: AJUS-0001)
            
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
            const { numero_ajuste, codigo_producto, cantidad } = req.body;

            // Validaciones básicas
            if (!numero_ajuste || !codigo_producto || cantidad === undefined) {
                return res.status(400).json({ mensaje: 'Los campos numero_ajuste, codigo_producto y cantidad son obligatorios.' });
            }

            const parsedCantidad = parseInt(cantidad, 10);
            if (isNaN(parsedCantidad) || parsedCantidad === 0) {
                return res.status(400).json({ mensaje: 'La cantidad debe ser un número entero diferente de cero.' });
            }

            // Verificar que la cabecera existe
            const cabecera = await AjusteCabecera.obtenerPorId(numero_ajuste);
            if (!cabecera) {
                return res.status(404).json({ mensaje: `La cabecera de ajuste ${numero_ajuste} no existe.` });
            }

            // Verificar que el producto existe
            const producto = await Producto.getByCodigo(codigo_producto);
            if (!producto) {
                return res.status(404).json({ mensaje: `El producto con código ${codigo_producto} no existe.` });
            }

            // Crear el detalle (dentro de la transacción se validará y actualizará el stock)
            const nuevoDetalle = await AjusteDetalle.crear({
                numero_ajuste,
                codigo_producto,
                cantidad: parsedCantidad
            });

            res.status(201).json(nuevoDetalle);
        } catch (error) {
            res.status(400).json({
                mensaje: 'No se pudo registrar el detalle de ajuste',
                error: error.message
            });
        }
    },

    // Actualizar un detalle de ajuste
    actualizar: async (req, res) => {
        try {
            const { id } = req.params; // id representa id_detalle
            const { codigo_producto, cantidad } = req.body;

            // Validaciones básicas
            if (!codigo_producto || cantidad === undefined) {
                return res.status(400).json({ mensaje: 'Los campos codigo_producto y cantidad son obligatorios.' });
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
            const producto = await Producto.getByCodigo(codigo_producto);
            if (!producto) {
                return res.status(404).json({ mensaje: `El producto con código ${codigo_producto} no existe.` });
            }

            const detalleActualizado = await AjusteDetalle.actualizar(id, {
                codigo_producto,
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
            const { id } = req.params; // id representa id_detalle

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
