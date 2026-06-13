import axios from 'axios';

const API_URL = 'http://localhost:3000/api/productos';

export const getProductos = async () => {
    const response = await axios.get(API_URL);
    return response.data.data;
};

export const getProducto = async (codigo) => {
    const response = await axios.get(`${API_URL}/${codigo}`);
    return response.data.data;
};

export const createProducto = async (producto) => {
    const response = await axios.post(API_URL, producto);
    return response.data;
};

export const updateProducto = async (codigo, producto) => {
    const response = await axios.put(`${API_URL}/${codigo}`, producto);
    return response.data;
};

export const desactivarProducto = async (codigo) => {
    const response = await axios.patch(`${API_URL}/${codigo}/desactivar`);
    return response.data;
};
