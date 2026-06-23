import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export const getAjustesCabecera = async () => {
    const response = await axios.get(`${API_BASE_URL}/ajustes/cabecera`);
    return response.data;
};

export const getAjusteCabeceraActual = async () => {
    const response = await axios.get(`${API_BASE_URL}/ajustes/cabecera/actual`);
    return response.data;
};

export const getAjusteCabeceraPorId = async (id) => {
    const response = await axios.get(`${API_BASE_URL}/ajustes/cabecera/${id}`);
    return response.data;
};

export const crearAjusteCabecera = async (cabecera) => {
    // Cabecera format: { descripcion, fecha, impreso }
    const response = await axios.post(`${API_BASE_URL}/ajustes/cabecera`, cabecera);
    return response.data;
};

export const actualizarAjusteCabecera = async (numeroAjuste, cabecera) => {
    const response = await axios.put(`${API_BASE_URL}/ajustes/cabecera/${numeroAjuste}`, cabecera);
    return response.data;
};

export const crearAjusteDetalle = async (detalle) => {
    // Detalle format: { numero_ajuste, codigo_producto, cantidad }
    const response = await axios.post(`${API_BASE_URL}/ajustes/detalle`, detalle);
    return response.data;
};

export const eliminarAjusteDetalle = async (idDetalle) => {
    const response = await axios.delete(`${API_BASE_URL}/ajustes/detalle/${idDetalle}`);
    return response.data;
};

export const imprimirAjuste = async (numeroAjuste) => {
    const response = await axios.post(`${API_BASE_URL}/ajustes/cabecera/${numeroAjuste}/imprimir`, {}, {
        responseType: 'blob'
    });
    return response;
};

export const getProductosCatalogo = async () => {
    const response = await axios.get(`${API_BASE_URL}/productos/catalogo`);
    return response.data.data;
};
