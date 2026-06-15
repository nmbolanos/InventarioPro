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

    // Obtener cabecera por ID (incluyendo sus detalles)
    obtenerPorId: async (req, res) => {
        try {
            const { id } = req.params;
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
            const { motivo, observacion, fecha } = req.body;

            // Validación básica
            if (!motivo) {
                return res.status(400).json({ mensaje: 'El motivo del ajuste es obligatorio.' });
            }

            const nuevaCabecera = await AjusteCabecera.crear({
                motivo,
                observacion,
                fecha
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
            const { id } = req.params;
            const { motivo, observacion, fecha } = req.body;

            // Validación básica
            if (!motivo) {
                return res.status(400).json({ mensaje: 'El motivo del ajuste es obligatorio.' });
            }

            // Verificar si existe la cabecera
            const cabeceraExistente = await AjusteCabecera.obtenerPorId(id);
            if (!cabeceraExistente) {
                return res.status(404).json({ mensaje: 'Cabecera de ajuste no encontrada' });
            }

            // Si no viene fecha, mantener la que tenía
            const fechaAjuste = fecha || cabeceraExistente.fecha;

            const cabeceraActualizada = await AjusteCabecera.actualizar(id, {
                motivo,
                observacion,
                fecha: fechaAjuste
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
            const { id } = req.params;
            
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
