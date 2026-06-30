const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const getDashboard = async () => {
  const res = await fetch(`${API_URL}/dashboard`);
  if (!res.ok) throw new Error('Error al obtener datos del dashboard');
  return res.json();
};
export const getMovimientosTemporales = async (agrupacion = 'mes') => {
  const res = await fetch(`${API_URL}/dashboard/movimientos-temporales?agrupacion=${agrupacion}`);
  if (!res.ok) throw new Error('Error al obtener movimientos temporales');
  return res.json();
};

export const getProductosMasVendidos = async () => {
  const res = await fetch(`${API_URL}/dashboard/productos-mas-vendidos`);
  if (!res.ok) throw new Error('Error al obtener productos más vendidos');
  return res.json();
};