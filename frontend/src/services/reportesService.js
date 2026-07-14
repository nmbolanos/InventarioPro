const API_URL = '/api';

export const getProductos = async () => {
  const res = await fetch(`${API_URL}/reportes/kardex/productos`);
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
};

export const getKardex = async (codigo, fechaInicio = '', fechaFin = '') => {
  const params = new URLSearchParams();
  if (fechaInicio) params.append('fechaInicio', fechaInicio);
  if (fechaFin)    params.append('fechaFin', fechaFin);

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_URL}/reportes/kardex/${codigo}${query}`);
  if (!res.ok) throw new Error('Error al obtener kardex');
  return res.json();
};

export const getReporteStock = async () => {
  const res = await fetch(`${API_URL}/reportes/stock`);
  if (!res.ok) throw new Error('Error al obtener reporte de stock');
  return res.json();
};