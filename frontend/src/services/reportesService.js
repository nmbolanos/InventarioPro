import axios from 'axios';

const API_URL = '/api';

export const getProductos = async () => {
  const res = await axios.get(`${API_URL}/kardex/productos`);
  return res.data;
};

export const getKardex = async (codigo) => {
  const res = await axios.get(`${API_URL}/kardex/${codigo}`);
  return res.data;
};

export const getReporteStock = async () => {
  const res = await axios.get(`${API_URL}/stock`);
  return res.data;
};