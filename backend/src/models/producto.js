const pool = require('../config/db');

const Producto = {
    // Obtener todos los productos
    obtenerTodos: async () => {
        const query = 'SELECT * FROM productos ORDER BY id ASC';
        const { rows } = await pool.query(query);
        return rows;
    },

    // Obtener un producto por ID
    obtenerPorId: async (id) => {
        const query = 'SELECT * FROM productos WHERE id = $1';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    // Obtener un producto por Código
    obtenerPorCodigo: async (codigo) => {
        const query = 'SELECT * FROM productos WHERE codigo = $1';
        const { rows } = await pool.query(query, [codigo]);
        return rows[0];
    },

    // Crear un producto
    crear: async (datos) => {
        const { codigo, nombre, descripcion, precio, stock } = datos;
        const query = `
            INSERT INTO productos (codigo, nombre, descripcion, precio, stock)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const { rows } = await pool.query(query, [
            codigo,
            nombre,
            descripcion || null,
            precio || 0.00,
            stock || 0
        ]);
        return rows[0];
    },

    // Actualizar un producto
    actualizar: async (id, datos) => {
        const { codigo, nombre, descripcion, precio, stock } = datos;
        const query = `
            UPDATE productos
            SET codigo = $1, nombre = $2, descripcion = $3, precio = $4, stock = $5, actualizado_en = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING *
        `;
        const { rows } = await pool.query(query, [
            codigo,
            nombre,
            descripcion || null,
            precio || 0.00,
            stock || 0,
            id
        ]);
        return rows[0];
    },

    // Eliminar un producto
    eliminar: async (id) => {
        const query = 'DELETE FROM productos WHERE id = $1 RETURNING *';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    // Actualizar stock directamente dentro de una transacción activa
    actualizarStockConTransaccion: async (client, id, cantidad) => {
        // Bloquear fila del producto para evitar race conditions
        const selectQuery = 'SELECT stock, nombre FROM productos WHERE id = $1 FOR UPDATE';
        const selectResult = await client.query(selectQuery, [id]);
        
        if (selectResult.rows.length === 0) {
            throw new Error(`Producto con ID ${id} no encontrado.`);
        }

        const producto = selectResult.rows[0];
        const nuevoStock = producto.stock + cantidad;

        if (nuevoStock < 0) {
            throw new Error(`Stock insuficiente para el producto "${producto.nombre}". Stock actual: ${producto.stock}, ajuste solicitado: ${cantidad}`);
        }

        const updateQuery = `
            UPDATE productos
            SET stock = $1, actualizado_en = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        const updateResult = await client.query(updateQuery, [nuevoStock, id]);
        return updateResult.rows[0];
    }
};

module.exports = Producto;
