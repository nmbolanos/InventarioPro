const COMPRAS_API_URL = '/api/compras';

export const getCatalogoProveedores = async () => {
    try {
        const response = await fetch(`${COMPRAS_API_URL}/catalogo/proveedores`);
        if (!response.ok) {
            throw new Error('Error al obtener el catálogo de proveedores');
        }
        const data = await response.json();
        if (data.success) {
            return data.data; // Array of { codigoProducto, proveedores: [] }
        }
        return [];
    } catch (error) {
        console.error('Error en getCatalogoProveedores:', error);
        return [];
    }
};
