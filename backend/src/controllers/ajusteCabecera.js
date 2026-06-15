const AjusteCabecera = require('../models/ajusteCabecera');
const AjusteDetalle = require('../models/ajusteDetalle');

const ajusteCabeceraController = {
    // Obtener todas las cabeceras de ajuste
    obtenerTodos: async (req, res) => {
        try {
            const cabeceras = await AjusteCabecera.obtenerTodos();
            res.json(cabeceras);
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al obtener cabeceras de ajuste',
                error: error.message
            });
        }
    },

    // Obtener cabecera por número de ajuste (incluyendo sus detalles)
    obtenerPorId: async (req, res) => {
        try {
            const { id } = req.params; // id representa numero_ajuste (ej: AJUS-0001)
            const cabecera = await AjusteCabecera.obtenerPorId(id);
            
            if (!cabecera) {
                return res.status(404).json({ mensaje: 'Cabecera de ajuste no encontrada' });
            }

            // Obtener los detalles asociados
            const detalles = await AjusteDetalle.obtenerPorCabeceraId(id);
            
            res.json({
                ...cabecera,
                detalles
            });
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al obtener la cabecera de ajuste',
                error: error.message
            });
        }
    },

    // Crear una nueva cabecera de ajuste
    crear: async (req, res) => {
        try {
            const { descripcion, fecha, impreso } = req.body;

            // Validación básica
            if (!descripcion) {
                return res.status(400).json({ mensaje: 'La descripción del ajuste es obligatoria.' });
            }

            const nuevaCabecera = await AjusteCabecera.crear({
                descripcion,
                fecha,
                impreso
            });

            res.status(201).json(nuevaCabecera);
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al crear la cabecera de ajuste',
                error: error.message
            });
        }
    },

    // Actualizar una cabecera de ajuste
    actualizar: async (req, res) => {
        try {
            const { id } = req.params; // id representa numero_ajuste
            const { descripcion, fecha, impreso } = req.body;

            // Validación básica
            if (!descripcion) {
                return res.status(400).json({ mensaje: 'La descripción del ajuste es obligatoria.' });
            }

            // Verificar si existe la cabecera
            const cabeceraExistente = await AjusteCabecera.obtenerPorId(id);
            if (!cabeceraExistente) {
                return res.status(404).json({ mensaje: 'Cabecera de ajuste no encontrada' });
            }

            const cabeceraActualizada = await AjusteCabecera.actualizar(id, {
                descripcion,
                fecha: fecha || cabeceraExistente.fecha,
                impreso: impreso !== undefined ? impreso : cabeceraExistente.impreso
            });

            res.json(cabeceraActualizada);
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al actualizar la cabecera de ajuste',
                error: error.message
            });
        }
    },

    // Eliminar una cabecera de ajuste (revertirá el stock de sus detalles automáticamente)
    eliminar: async (req, res) => {
        try {
            const { id } = req.params; // id representa numero_ajuste
            
            // Verificar si existe la cabecera
            const cabeceraExistente = await AjusteCabecera.obtenerPorId(id);
            if (!cabeceraExistente) {
                return res.status(404).json({ mensaje: 'Cabecera de ajuste no encontrada' });
            }

            const cabeceraEliminada = await AjusteCabecera.eliminar(id);
            
            res.json({
                mensaje: 'Cabecera de ajuste y sus detalles eliminados, y el stock ha sido revertido.',
                cabecera: cabeceraEliminada
            });
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al eliminar la cabecera de ajuste',
                error: error.message
            });
        }
    }
};

module.exports = ajusteCabeceraController;
