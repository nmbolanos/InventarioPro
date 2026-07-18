const prisma = require('../../config/prisma');
const ProductoDTO = require('./ProductoDTO');

const getAllProductos = async (req, res) => {
    try {
        const productos = await prisma.producto.findMany({
            orderBy: { codigo: 'desc' }
        });
        res.json({ success: true, data: productos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener los productos.', error: error.message });
    }
};

const getProductoByCodigo = async (req, res) => {
    try {
        const { codigo } = req.params;
        const producto = await prisma.producto.findUnique({
            where: { codigo }
        });
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
        const validation = ProductoDTO.validate(req.body, true);
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: 'Errores de validación', errors: validation.errors });
        }

        if (validation.data.codigo) {
            const existing = await prisma.producto.findUnique({ where: { codigo: validation.data.codigo } });
            if (existing) {
                return res.status(409).json({ success: false, message: 'El código de producto ya existe. Utilice otro.' });
            }
        }

        const nuevoProducto = await prisma.producto.create({
            data: validation.data
        });
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

        if (codigo !== validation.data.codigo && validation.data.codigo) {
            const existing = await prisma.producto.findUnique({ where: { codigo: validation.data.codigo } });
            if (existing) {
                return res.status(409).json({ success: false, message: 'El nuevo código de producto ya existe.' });
            }
        }

        // Fetch to ensure it exists
        const existingToUpdate = await prisma.producto.findUnique({ where: { codigo } });
        if (!existingToUpdate) {
             return res.status(404).json({ success: false, message: 'Producto no encontrado para actualizar.' });
        }

        const dataToUpdate = { ...validation.data };
        
        // Prisma update
        const productoActualizado = await prisma.producto.update({
            where: { codigo },
            data: dataToUpdate
        });
        
        res.json({ success: true, message: 'Producto actualizado exitosamente.', data: productoActualizado });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar el producto.', error: error.message });
    }
};

const desactivarProducto = async (req, res) => {
    try {
        const { codigo } = req.params;
        const existingToUpdate = await prisma.producto.findUnique({ where: { codigo } });
        if (!existingToUpdate) {
             return res.status(404).json({ success: false, message: 'Producto no encontrado para desactivar.' });
        }

        const productoDesactivado = await prisma.producto.update({
            where: { codigo },
            data: { estado: 'Inactivo' }
        });
        
        res.json({ success: true, message: 'Producto desactivado (inactivo) exitosamente.', data: productoDesactivado });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al desactivar el producto.', error: error.message });
    }
};

const getCatalogo = async (req, res) => {
    try {
        const catalogo = await prisma.producto.findMany({
            where: { estado: 'Activo' },
            select: {
                codigo: true,
                nombre: true,
                descripcion: true,
                stock_actual: true,
                pvp: true,
                graba_iva: true
            },
            orderBy: { nombre: 'asc' }
        });
        
        const ivaPorcentaje = process.env.IVA_PORCENTAJE ? parseFloat(process.env.IVA_PORCENTAJE) : 15;

        const catalogoConIva = catalogo.map(producto => ({
            ...producto,
            porcentaje_iva_aplicado: producto.graba_iva ? ivaPorcentaje : 0
        }));

        res.json({ success: true, data: catalogoConIva });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el catálogo de productos.', error: error.message });
    }
};

module.exports = {
    getAllProductos,
    getProductoByCodigo,
    createProducto,
    updateProducto,
    desactivarProducto,
    getCatalogo
};
