import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import axios from 'axios'

// Configuración global de Axios
axios.defaults.headers.common['x-api-key'] = 'utn-compras-fact-2026-secret-key';

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

  config = config || {};
  config.headers = config.headers || {};

  const injectHeader = (name, value) => {
    if (config.headers instanceof Headers) {
      config.headers.set(name, value);
    } else if (Array.isArray(config.headers)) {
      config.headers.push([name, value]);
    } else {
      config.headers[name] = value;
    }
  };

  // Inyectar API Key en todas las peticiones
  injectHeader('x-api-key', 'utn-compras-fact-2026-secret-key');

  // Solo inyectamos el token si existe y no es una petición externa (como compras)
  if (token && typeof resource === 'string' && !resource.includes('/api/compras')) {
    injectHeader('Authorization', `Bearer ${token}`);
  }
  
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
