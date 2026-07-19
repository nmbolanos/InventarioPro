import axios from 'axios';

const API_URL = '/api';

export const getProductos = async () => {
  const res = await axios.get(`${API_URL}/kardex/productos`);
  return res.data;
};

export const getKardex = async (codigo, fechaInicio = '', fechaFin = '') => {
  const params = new URLSearchParams();
  if (fechaInicio) params.append('fechaInicio', fechaInicio);
  if (fechaFin)    params.append('fechaFin', fechaFin);

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await axios.get(`${API_URL}/kardex/${codigo}${query}`);
  return res.data;
};

export const getReporteStock = async () => {
  const res = await axios.get(`${API_URL}/stock`);
  return res.data;
};
