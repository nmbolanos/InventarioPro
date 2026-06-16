const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const getProductos = async () => {
  const res = await fetch(`${API_URL}/reportes/kardex/productos`);
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
};

export const getKardex = async (codigo) => {
  const res = await fetch(`${API_URL}/reportes/kardex/${codigo}`);
  if (!res.ok) throw new Error('Error al obtener kardex');
  return res.json();
};

export const getReporteStock = async () => {
  const res = await fetch(`${API_URL}/reportes/stock`);
  if (!res.ok) throw new Error('Error al obtener reporte de stock');
  return res.json();
};