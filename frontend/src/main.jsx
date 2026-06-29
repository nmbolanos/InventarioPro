import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// 1. Interceptor global para Axios (usado por ProductoService y AjusteService)
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. Monkey patch de fetch global (usado por ReportesService y ComprasService)
const { fetch: originalFetch } = window;
window.fetch = async (...args) => {
  let [resource, config] = args;
  const token = localStorage.getItem('token');

  // Solo inyectamos el token si existe y no es una petición externa (como compras)
  if (token && typeof resource === 'string' && !resource.includes('/api/compras')) {
    config = config || {};
    config.headers = config.headers || {};

    if (config.headers instanceof Headers) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else if (Array.isArray(config.headers)) {
      config.headers.push(['Authorization', `Bearer ${token}`]);
    } else {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
