const pool = require('../config/db');

class Producto {
    static async getAll() {
        const query = 'SELECT * FROM producto ORDER BY codigo ASC';
        const result = await pool.query(query);
        return result.rows;
    }

    static async getByCodigo(codigo) {
        const query = 'SELECT * FROM producto WHERE codigo = $1';
        const result = await pool.query(query, [codigo]);
        return result.rows[0];
    }

    static async generarSiguienteCodigo() {
        const query = `
            SELECT codigo 
            FROM producto 
            WHERE codigo LIKE 'PRD-%' 
            ORDER BY codigo DESC 
            LIMIT 1
        `;
        const result = await pool.query(query);
        if (result.rows.length > 0) {
            const lastCode = result.rows[0].codigo;     
            const numberPart = parseInt(lastCode.replace('PRD-', ''), 10);
            const nextNumber = numberPart + 1;
            return `PRD-${nextNumber.toString().padStart(4, '0')}`;
        }
        return 'PRD-0001';
    }

    static async create(producto) {
        let { codigo, nombre, descripcion, graba_iva, costo, pvp, estado } = producto;
        
        if (!codigo || codigo.trim() === '') {
            codigo = await this.generarSiguienteCodigo();
        }

        const query = `
            INSERT INTO producto (codigo, nombre, descripcion, graba_iva, costo, pvp, estado)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [codigo, nombre, descripcion, graba_iva, costo, pvp, estado];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async update(codigoActual, producto) {
        const { codigo, nombre, descripcion, graba_iva, costo, pvp, estado } = producto;
        const query = `
            UPDATE producto
            SET codigo = $1, nombre = $2, descripcion = $3, graba_iva = $4, costo = $5, pvp = $6, estado = $7
            WHERE codigo = $8
            RETURNING *
        `;
        const values = [codigo, nombre, descripcion, graba_iva, costo, pvp, estado, codigoActual];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async desactivar(codigo) {
        const query = `
            UPDATE producto
            SET estado = 'Inactivo'
            WHERE codigo = $1
            RETURNING *
        `;
        const result = await pool.query(query, [codigo]);
        return result.rows[0];
    }

    static async getCatalogo() {
        const query = `
            SELECT codigo, nombre, descripcion, stock_actual, pvp, graba_iva 
            FROM producto 
            WHERE estado = 'Activo'
            ORDER BY nombre ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = Producto;
