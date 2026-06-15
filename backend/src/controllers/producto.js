const Producto = require('../models/producto');

const productoController = {
    // Obtener todos los productos
    obtenerTodos: async (req, res) => {
        try {
            const productos = await Producto.obtenerTodos();
            res.json(productos);
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al obtener productos',
                error: error.message
            });
        }
    },

    // Obtener producto por ID
    obtenerPorId: async (req, res) => {
        try {
            const { id } = req.params;
            const producto = await Producto.obtenerPorId(id);
            if (!producto) {
                return res.status(404).json({ mensaje: 'Producto no encontrado' });
            }
            res.json(producto);
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al obtener el producto',
                error: error.message
            });
        }
    },

    // Crear un nuevo producto
    crear: async (req, res) => {
        try {
            const { codigo, nombre, descripcion, precio, stock } = req.body;

            // Validaciones básicas
            if (!codigo || !nombre) {
                return res.status(400).json({ mensaje: 'Código y Nombre son campos requeridos.' });
            }

            // Validar si el código ya existe
            const productoExistente = await Producto.obtenerPorCodigo(codigo);
            if (productoExistente) {
                return res.status(400).json({ mensaje: `El producto con código ${codigo} ya existe.` });
            }

            const nuevoProducto = await Producto.crear({
                codigo,
                nombre,
                descripcion,
                precio: parseFloat(precio) || 0.00,
                stock: parseInt(stock, 10) || 0
            });

            res.status(201).json(nuevoProducto);
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al crear el producto',
                error: error.message
            });
        }
    },

    // Actualizar un producto
    actualizar: async (req, res) => {
        try {
            const { id } = req.params;
            const { codigo, nombre, descripcion, precio, stock } = req.body;

            // Validaciones básicas
            if (!codigo || !nombre) {
                return res.status(400).json({ mensaje: 'Código y Nombre son campos requeridos.' });
            }

            // Verificar existencia del producto
            const productoExistente = await Producto.obtenerPorId(id);
            if (!productoExistente) {
                return res.status(404).json({ mensaje: 'Producto no encontrado' });
            }

            // Verificar si el código nuevo ya lo tiene otro producto
            if (codigo !== productoExistente.codigo) {
                const prodCodigo = await Producto.obtenerPorCodigo(codigo);
                if (prodCodigo) {
                    return res.status(400).json({ mensaje: `El código ${codigo} ya está asignado a otro producto.` });
                }
            }

            const productoActualizado = await Producto.actualizar(id, {
                codigo,
                nombre,
                descripcion,
                precio: parseFloat(precio) || 0.00,
                stock: parseInt(stock, 10) || 0
            });

            res.json(productoActualizado);
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al actualizar el producto',
                error: error.message
            });
        }
    },

    // Eliminar un producto
    eliminar: async (req, res) => {
        try {
            const { id } = req.params;
            const productoEliminado = await Producto.eliminar(id);
            if (!productoEliminado) {
                return res.status(404).json({ mensaje: 'Producto no encontrado o no pudo ser eliminado' });
            }
            res.json({
                mensaje: 'Producto eliminado con éxito',
                producto: productoEliminado
            });
        } catch (error) {
            res.status(500).json({
                mensaje: 'Error al eliminar el producto',
                error: error.message
            });
        }
    }
};

module.exports = productoController;
