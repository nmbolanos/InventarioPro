const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Producto:
 *       type: object
 *       required:
 *         - codigo
 *         - nombre
 *         - costo
 *         - pvp
 *       properties:
 *         codigo:
 *           type: string
 *           description: Código único del producto
 *         nombre:
 *           type: string
 *           description: Nombre del producto
 *         descripcion:
 *           type: string
 *           description: Descripción detallada
 *         graba_iva:
 *           type: boolean
 *           description: Indica si el producto aplica IVA
 *         costo:
 *           type: number
 *           description: Costo de compra
 *         pvp:
 *           type: number
 *           description: Precio de Venta al Público
 *         estado:
 *           type: string
 *           enum: [Activo, Inactivo]
 *           description: Estado del producto
 */

/**
 * @swagger
 * /api/productos/catalogo:
 *   get:
 *     summary: Obtiene el catálogo de productos activos (API de Salida)
 *     tags: [Catálogo]
 *     responses:
 *       200:
 *         description: Lista de productos activos con su stock y % IVA
 */
router.get('/catalogo', productoController.getCatalogo);

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Obtiene todos los productos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de todos los productos
 */
router.get('/', productoController.getAllProductos);

/**
 * @swagger
 * /api/productos/{codigo}:
 *   get:
 *     summary: Obtiene un producto por código
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         schema:
 *           type: string
 *         required: true
 *         description: Código del producto
 *     responses:
 *       200:
 *         description: Detalles del producto
 *       404:
 *         description: Producto no encontrado
 */
router.get('/:codigo', productoController.getProductoByCodigo);

/**
 * @swagger
 * /api/productos:
 *   post:
 *     summary: Crea un nuevo producto
 *     tags: [Productos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Producto'
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       400:
 *         description: Error de validación
 *       409:
 *         description: El código ya existe
 */
router.post('/', productoController.createProducto);

/**
 * @swagger
 * /api/productos/{codigo}:
 *   put:
 *     summary: Actualiza un producto existente
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         schema:
 *           type: string
 *         required: true
 *         description: Código del producto actual
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Producto'
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Producto no encontrado
 */
router.put('/:codigo', productoController.updateProducto);

/**
 * @swagger
 * /api/productos/{codigo}/desactivar:
 *   patch:
 *     summary: Desactiva un producto (Cambia estado a Inactivo)
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         schema:
 *           type: string
 *         required: true
 *         description: Código del producto a desactivar
 *     responses:
 *       200:
 *         description: Producto desactivado exitosamente
 *       404:
 *         description: Producto no encontrado
 */
router.patch('/:codigo/desactivar', productoController.desactivarProducto);

module.exports = router;
