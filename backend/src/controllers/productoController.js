const Producto = require('../models/producto');
const ProductoDTO = require('../models/ProductoDTO');

const getAllProductos = async (req, res) => {
    try {
        const productos = await Producto.getAll();
        res.json({ success: true, data: productos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener los productos.', error: error.message });
    }
};

const getProductoByCodigo = async (req, res) => {
    try {
        const { codigo } = req.params;
        const producto = await Producto.getByCodigo(codigo);
        if (!producto) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
        res.json({ success: true, data: producto });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el producto.', error: error.message });
    }
};

const createProducto = async (req, res) => {
    try {
        const validation = ProductoDTO.validate(req.body, true); // true = isCreating
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: 'Errores de validación', errors: validation.errors });
        }

        // Check for duplicate code only if a custom code was provided
        if (validation.data.codigo) {
            const existing = await Producto.getByCodigo(validation.data.codigo);
            if (existing) {
                return res.status(409).json({ success: false, message: 'El código de producto ya existe. Utilice otro.' });
            }
        }

        const nuevoProducto = await Producto.create(validation.data);
        res.status(201).json({ success: true, message: 'Producto creado exitosamente.', data: nuevoProducto });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear el producto.', error: error.message });
    }
};

const updateProducto = async (req, res) => {
    try {
        const { codigo } = req.params;
        const validation = ProductoDTO.validate(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: 'Errores de validación', errors: validation.errors });
        }

        // If trying to change the code to a new one, check if the new code exists
        if (codigo !== validation.data.codigo) {
            const existing = await Producto.getByCodigo(validation.data.codigo);
            if (existing) {
                return res.status(409).json({ success: false, message: 'El nuevo código de producto ya existe.' });
            }
        }

        const productoActualizado = await Producto.update(codigo, validation.data);
        if (!productoActualizado) {
             return res.status(404).json({ success: false, message: 'Producto no encontrado para actualizar.' });
        }
        
        res.json({ success: true, message: 'Producto actualizado exitosamente.', data: productoActualizado });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar el producto.', error: error.message });
    }
};

const desactivarProducto = async (req, res) => {
    try {
        const { codigo } = req.params;
        const productoDesactivado = await Producto.desactivar(codigo);
        if (!productoDesactivado) {
             return res.status(404).json({ success: false, message: 'Producto no encontrado para desactivar.' });
        }
        res.json({ success: true, message: 'Producto desactivado (inactivo) exitosamente.', data: productoDesactivado });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al desactivar el producto.', error: error.message });
    }
};

// API de Salida
const getCatalogo = async (req, res) => {
    try {
        const catalogo = await Producto.getCatalogo();
        
        // Obtener el porcentaje de IVA del archivo .env (por defecto 15 si no existe)
        const ivaPorcentaje = process.env.IVA_PORCENTAJE ? parseFloat(process.env.IVA_PORCENTAJE) : 15;

        // Inyectar el valor del IVA a los productos que sí graban IVA
        const catalogoConIva = catalogo.map(producto => ({
            ...producto,
            porcentaje_iva_aplicado: producto.graba_iva ? ivaPorcentaje : 0
        }));

        res.json({ success: true, data: catalogoConIva });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el catálogo de productos.', error: error.message });
    }
};

const addStock = async (req, res) => {
    try {
        const { codigo } = req.params;
        const { cantidad } = req.body;

        if (cantidad === undefined || isNaN(cantidad)) {
            return res.status(400).json({ success: false, message: 'La cantidad es requerida y debe ser un número.' });
        }

        const productoActualizado = await Producto.addStock(codigo, parseInt(cantidad, 10));
        
        if (!productoActualizado) {
             return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
        
        res.json({ success: true, message: `Stock actualizado exitosamente. Nuevo stock: ${productoActualizado.stock_actual}`, data: productoActualizado });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar el stock.', error: error.message });
    }
};

module.exports = {
    getAllProductos,
    getProductoByCodigo,
    createProducto,
    updateProducto,
    desactivarProducto,
    getCatalogo,
    addStock
};
