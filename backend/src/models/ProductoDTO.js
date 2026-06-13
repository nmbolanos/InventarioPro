class ProductoDTO {
    static validate(data, isCreating = false) {
        const errors = [];

        if (!isCreating && (!data.codigo || data.codigo.trim() === '')) {
            errors.push('El código del producto es obligatorio.');
        }

        if (!data.nombre || data.nombre.trim() === '') {
            errors.push('El nombre del producto es obligatorio.');
        }

        if (data.costo === undefined || data.costo === null || isNaN(data.costo) || Number(data.costo) < 0) {
            errors.push('El costo debe ser un valor numérico válido mayor o igual a 0.');
        }

        if (data.pvp === undefined || data.pvp === null || isNaN(data.pvp) || Number(data.pvp) < 0) {
            errors.push('El PVP debe ser un valor numérico válido mayor o igual a 0.');
        }

        if (data.graba_iva !== undefined && typeof data.graba_iva !== 'boolean' && data.graba_iva !== 'true' && data.graba_iva !== 'false') {
             errors.push('El campo graba_iva debe ser un valor booleano.');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            data: errors.length === 0 ? {
                codigo: data.codigo ? data.codigo.trim() : '',
                nombre: data.nombre.trim(),
                descripcion: data.descripcion ? data.descripcion.trim() : null,
                graba_iva: data.graba_iva === true || data.graba_iva === 'true',
                costo: Number(data.costo),
                pvp: Number(data.pvp),
                estado: data.estado === 'Inactivo' ? 'Inactivo' : 'Activo' // Por defecto Activo
            } : null
        };
    }
}

module.exports = ProductoDTO;
