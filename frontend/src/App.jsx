import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ProductosPage from './pages/ProductosPage';
import ProductoFormPage from './pages/ProductoFormPage';
import KardexPage from './pages/KardexPage';
import ReporteStockPage from './pages/ReporteStockPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="productos/nuevo" element={<ProductoFormPage />} />
          <Route path="productos/editar/:codigo" element={<ProductoFormPage />} />
          <Route path="/kardex" element={<KardexPage />} />
          <Route path="/reporte-stock" element={<ReporteStockPage />} />
          {/* Aquí se agregarán más rutas luego como path="ajustes" etc. */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
