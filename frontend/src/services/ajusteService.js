import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export const getAjustesCabecera = async () => {
    const response = await axios.get(`${API_BASE_URL}/ajustes/cabecera`);
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

export const crearAjusteDetalle = async (detalle) => {
    // Detalle format: { numero_ajuste, codigo_producto, cantidad }
    const response = await axios.post(`${API_BASE_URL}/ajustes/detalle`, detalle);
    return response.data;
};

export const getProductosCatalogo = async () => {
    const response = await axios.get(`${API_BASE_URL}/productos/catalogo`);
    return response.data.data;
};
