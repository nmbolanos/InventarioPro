import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ProductosPage from './pages/ProductosPage';
import ProductoFormPage from './pages/ProductoFormPage';
import AjusteProductosPage from './pages/AjusteProductosPage';
import KardexPage from './pages/KardexPage';
import ReporteStockPage from './pages/ReporteStockPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública de Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas generales (Bodeguero o Supervisor) bajo el Layout común 
        EN LUGAR DE CREAR UN allowedRoles, crear un allowedPermisions y verificar al usuario logeado mediante los permisos
        que arroja la API de ese user
        */}
        <Route element={<ProtectedRoute allowedRoles={['INV_BODEGUERO', 'INV_SUPERVISOR']} />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="productos" element={<ProductosPage />} />
            <Route path="productos/nuevo" element={<ProductoFormPage />} />
            <Route path="productos/editar/:codigo" element={<ProductoFormPage />} />
            <Route path="ajustes" element={<AjusteProductosPage />} />

            {/* Rutas exclusivas para Supervisor */}
            <Route element={<ProtectedRoute allowedRoles={['INV_SUPERVISOR']} />}>
              <Route path="kardex" element={<KardexPage />} />
              <Route path="reporte-stock" element={<ReporteStockPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
