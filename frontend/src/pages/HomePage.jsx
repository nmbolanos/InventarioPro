import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { 
  getDashboard, 
  getMovimientosTemporales, 
  getProductosMasVendidos 
} from '../services/dashboardService';

const COLOR_PRIMARIO = '#c21111';

export default function HomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
    // Estados para gráfico temporal
    const [movimientosTemp, setMovimientosTemp] = useState([]);
    const [agrupacion, setAgrupacion] = useState('mes'); // 'mes' o 'semana'
    const [cargandoTemp, setCargandoTemp] = useState(false);

    // Estado para productos más vendidos
    const [masVendidos, setMasVendidos] = useState([]);

    // Estados para paginación de la tabla de alertas
    const [paginaActual, setPaginaActual] = useState(1);
    const FILAS_POR_PAGINA = 10;

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setError('No se pudo cargar el dashboard'))
      .finally(() => setLoading(false));
  }, []);

      // Cargar productos más vendidos (una sola vez)
      useEffect(() => {
      getProductosMasVendidos()
      .then(res => setMasVendidos(res.datos))
      .catch(() => console.error('Error al cargar productos más vendidos'));
      }, []);

      // Cargar movimientos temporales (cada vez que cambia la agrupación)
      // Cargar movimientos temporales (cada vez que cambia la agrupación)
      useEffect(() => {
      // Usamos un flag o una pequeña pausa/microtarea para actualizar el estado de carga de forma segura
        const cargarDatos = async () => {
          setCargandoTemp(true);
          try {
            const res = await getMovimientosTemporales(agrupacion);
         setMovimientosTemp(res.datos);
         } catch (err) {
          console.error('Error al cargar movimientos temporales', err);
          } finally {
          setCargandoTemp(false);
         }
        };

  cargarDatos();
}, [agrupacion]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border" role="status" style={{ color: COLOR_PRIMARIO }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  const { metricas, topProductos, distribucionEstado, alertasReposicion } = data;

  return (
    <div className="container-fluid py-4 px-4">

      {/* Título */}
      <h2 className="fw-bold mb-4" style={{ color: COLOR_PRIMARIO }}>
        Dashboard de Inventario
      </h2>

      {/* ===== Tarjetas de métricas ===== */}
      <div className="row g-3 mb-4">

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card shadow-sm border-0 h-100" style={{ borderTop: `4px solid ${COLOR_PRIMARIO}` }}>
            <div className="card-body">
              <div className="text-muted small">Total Productos</div>
              <div className="fs-3 fw-bold" style={{ color: COLOR_PRIMARIO }}>
                {metricas.totalProductos}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card shadow-sm border-0 h-100" style={{ borderTop: '4px solid #28a745' }}>
            <div className="card-body">
              <div className="text-muted small">Unidades en Stock</div>
              <div className="fs-3 fw-bold text-success">
                {metricas.totalUnidades}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card shadow-sm border-0 h-100" style={{ borderTop: '4px solid #fd7e14' }}>
            <div className="card-body">
              <div className="text-muted small">Valor Inventario</div>
              <div className="fs-3 fw-bold text-warning">
                ${metricas.valorInventario.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card shadow-sm border-0 h-100" style={{ borderTop: '4px solid #dc3545' }}>
            <div className="card-body">
              <div className="text-muted small">Productos sin Stock</div>
              <div className="fs-3 fw-bold text-danger">
                {metricas.sinStock}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ===== Gráficas ===== */}
      <div className="row g-3 mb-4">

        {/* Top productos por stock */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h6 className="fw-bold mb-3" style={{ color: COLOR_PRIMARIO }}>
                Top 5 Productos con Mayor Stock
              </h6>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topProductos} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="nombre" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="stock" fill={COLOR_PRIMARIO} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Distribución por estado (semáforo) */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h6 className="fw-bold mb-3" style={{ color: COLOR_PRIMARIO }}>
                Distribución de Stock
              </h6>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={distribucionEstado}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ value }) => value}
                  >
                    {distribucionEstado.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ===== NUEVO: Gráfico Temporal Compras vs Ventas ===== */}
<div className="row g-3 mb-4">
  <div className="col-12 col-lg-7">
    <div className="card shadow-sm border-0 h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h6 className="fw-bold mb-0" style={{ color: COLOR_PRIMARIO }}>
            Compras vs Ventas
          </h6>

          {/* Selector mes/semana */}
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className={`btn ${agrupacion === 'semana' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setAgrupacion('semana')}
            >
              Semana
            </button>
            <button
              type="button"
              className={`btn ${agrupacion === 'mes' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setAgrupacion('mes')}
            >
              Mes
            </button>
          </div>
        </div>

        {cargandoTemp ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border spinner-border-sm" style={{ color: COLOR_PRIMARIO }} />
          </div>
        ) : movimientosTemp.length === 0 ? (
          <div className="alert alert-info mb-0">No hay movimientos registrados aún.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
  <BarChart data={movimientosTemp} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
    <CartesianGrid strokeDasharray="3 3" vertical={false} />
    <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
    <YAxis allowDecimals={false} />
    <Tooltip
      formatter={(value, name) => [value, name === 'compras' ? 'Compras' : 'Ventas']}
    />
    <Legend
      formatter={value => value === 'compras' ? 'Compras' : 'Ventas'}
    />
    <Bar dataKey="compras" name="compras" fill="#28a745" radius={[4, 4, 0, 0]} />
    <Bar dataKey="ventas"  name="ventas"  fill="#dc3545" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
        )}
      </div>
    </div>
  </div>

  {/* Productos más vendidos - Gráfico de área */}
  <div className="col-12 col-lg-5">
    <div className="card shadow-sm border-0 h-100">
      <div className="card-body">
        <h6 className="fw-bold mb-3" style={{ color: COLOR_PRIMARIO }}>
          Productos Más Vendidos
        </h6>
        {masVendidos.length === 0 ? (
          <div className="alert alert-info mb-0">No hay ventas registradas aún.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
  <BarChart data={masVendidos} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
    <CartesianGrid strokeDasharray="3 3" vertical={false} />
    <XAxis
      dataKey="nombre"
      tick={{ fontSize: 10 }}
      angle={-30}
      textAnchor="end"
      interval={0}
    />
    <YAxis allowDecimals={false} />
    <Tooltip
      formatter={(value) => [value, 'Unidades vendidas']}
    />
    <Bar dataKey="cantidad" name="Unidades vendidas" radius={[4, 4, 0, 0]}>
      {masVendidos.map((entry, index) => (
        <Cell
          key={`cell-${index}`}
          fill={index % 2 === 0 ? COLOR_PRIMARIO : '#0077cc'}
        />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
        )}
      </div>
    </div>
  </div>
</div>

      {/* ===== Alertas de Reposición (semáforo en tabla) ===== */}
      <div className="row g-3">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h6 className="fw-bold mb-3" style={{ color: COLOR_PRIMARIO }}>
                🚦 Alertas de Reposición
              </h6>

              {alertasReposicion.length === 0 ? (
  <div className="alert alert-success mb-0">
    Todos los productos tienen niveles de stock óptimos.
  </div>
) : (
  <>
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead>
          <tr className="table-light">
            <th>Código</th>
            <th>Producto</th>
            <th>Stock Actual</th>
            <th>Nivel</th>
            <th style={{ width: '30%' }}>Indicador</th>
          </tr>
        </thead>
        <tbody>
          {alertasReposicion
            .slice((paginaActual - 1) * FILAS_POR_PAGINA, paginaActual * FILAS_POR_PAGINA)
            .map(p => {
              const esCritico = p.nivel === 'critico';
              const porcentaje = Math.min((p.stock_actual / 5) * 100, 100);
              return (
                <tr key={p.codigo}>
                  <td className="text-muted">{p.codigo}</td>
                  <td className="fw-medium">{p.nombre}</td>
                  <td className="fw-bold">{p.stock_actual}</td>
                  <td>
                    <span className={`badge ${esCritico ? 'bg-danger' : 'bg-warning text-dark'}`}>
                      {esCritico ? 'Crítico' : 'Bajo'}
                    </span>
                  </td>
                  <td>
                    <div className="progress" style={{ height: '10px' }}>
                      <div
                        className={`progress-bar ${esCritico ? 'bg-danger' : 'bg-warning'}`}
                        style={{ width: `${esCritico ? 100 : porcentaje}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>

    {/* Controles de paginación */}
    {alertasReposicion.length > FILAS_POR_PAGINA && (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <span className="text-muted small">
          Mostrando {(paginaActual - 1) * FILAS_POR_PAGINA + 1}–
          {Math.min(paginaActual * FILAS_POR_PAGINA, alertasReposicion.length)} de {alertasReposicion.length}
        </span>

        <nav>
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
              >
                Anterior
              </button>
            </li>

            {Array.from({ length: Math.ceil(alertasReposicion.length / FILAS_POR_PAGINA) }, (_, i) => i + 1).map(num => (
              <li key={num} className={`page-item ${paginaActual === num ? 'active' : ''}`}>
                <button
                  className="page-link"
                  style={paginaActual === num ? { background: COLOR_PRIMARIO, borderColor: COLOR_PRIMARIO } : {}}
                  onClick={() => setPaginaActual(num)}
                >
                  {num}
                </button>
              </li>
            ))}

            <li className={`page-item ${paginaActual === Math.ceil(alertasReposicion.length / FILAS_POR_PAGINA) ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => setPaginaActual(p => Math.min(Math.ceil(alertasReposicion.length / FILAS_POR_PAGINA), p + 1))}
              >
                Siguiente
              </button>
            </li>
          </ul>
        </nav>
      </div>
    )}
  </>             
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}