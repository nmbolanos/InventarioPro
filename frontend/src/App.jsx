import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ProductosPage from './pages/ProductosPage';
import ProductoFormPage from './pages/ProductoFormPage';
import AjusteProductosPage from './pages/AjusteProductosPage';
import KardexPage from './pages/KardexPage';
import ReporteStockPage from './pages/ReporteStockPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

function IndexRoute() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  const user = JSON.parse(userStr);
  const perms = (user.permissions || []).map(p => p.toLowerCase().trim());
  
  if (perms.includes('inv_reportes')) return <HomePage />;
  if (perms.includes('inv_productos')) return <Navigate to="/productos" replace />;
  if (perms.includes('inv_kardex')) return <Navigate to="/kardex" replace />;
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública de Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas (Requieren al menos un permiso del sistema para entrar al Layout) */}
        <Route element={<ProtectedRoute allowedPermissions={['INV_PRODUCTOS', 'INV_KARDEX', 'INV_REPORTES']} />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<IndexRoute />} />
            
            <Route element={<ProtectedRoute allowedPermissions={['INV_PRODUCTOS']} />}>
              <Route path="productos" element={<ProductosPage />} />
              <Route path="productos/nuevo" element={<ProductoFormPage />} />
              <Route path="productos/editar/:codigo" element={<ProductoFormPage />} />
              <Route path="ajustes" element={<AjusteProductosPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedPermissions={['INV_KARDEX']} />}>
              <Route path="kardex" element={<KardexPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedPermissions={['INV_REPORTES']} />}>
              <Route path="reporte-stock" element={<ReporteStockPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
