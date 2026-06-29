import { useState, useEffect } from 'react';
import { getReporteStock } from '../services/reportesService';

const CARD_CONFIG = [
  { key: 'totalProductos', label: 'Total Productos',    color: '#00aaff' },
  { key: 'totalUnidades',  label: 'Total Unidades',     color: '#28a745' },
  { key: 'valorTotal',     label: 'Valor Inventario',   color: '#fd7e14', prefix: '$' },
  { key: 'sinStock',       label: 'Sin Stock',          color: '#dc3545' },
  { key: 'stockBajo',      label: 'Stock Bajo (< 5)',   color: '#ffc107' },
  { key: 'inactivos',      label: 'Inactivos',          color: '#6c757d' },
];

export default function ReporteStockPage() {
  const [data,      setData]    = useState(null);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const FILAS_POR_PAGINA = 10;

  useEffect(() => {
    getReporteStock()
      .then(setData)
      .catch(() => setError('Error al cargar el reporte de stock'))
      .finally(() => setLoading(false));
  }, []);

  // 🆕 Manejadores que actualizan el valor y reinician la página a 1 en un solo ciclo
  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
    setPaginaActual(1);
  };

  const handleFiltroEstadoChange = (e) => {
    setFiltroEstado(e.target.value);
    setPaginaActual(1);
  };

  const productosFiltrados = data?.productos?.filter(p => {
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado =
      filtroEstado === 'Todos' || p.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  }) ?? [];

  // Cálculo de productos a mostrar en la página actual
  const totalPaginas = Math.ceil(productosFiltrados.length / FILAS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const productosPaginados = productosFiltrados.slice(indiceInicio, indiceInicio + FILAS_POR_PAGINA);

  return (
    <div style={{ padding: '24px' }}>

      <h2 style={{ color: '#00aaff', fontWeight: 'bold', fontSize: '1.6rem', marginBottom: '20px' }}>
        Reporte de Stock de Productos
      </h2>

      {loading && <p style={{ color: '#00aaff' }}>Cargando reporte...</p>}
      {error   && (
        <p style={{ color: '#dc3545', background: '#f8d7da', padding: '10px 16px', borderRadius: '6px' }}>
          {error}
        </p>
      )}

      {data && (
        <>
          {/* Tarjetas resumen */}
          <div style={{ display: 'flex', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {CARD_CONFIG.map(card => (
              <div key={card.key} style={{
                background: '#fff', borderRadius: '10px',
                padding: '14px 20px', minWidth: '140px', textAlign: 'center',
                borderTop: `4px solid ${card.color}`,
                boxShadow: '0 2px 8px rgba(0,170,255,0.08)'
              }}>
                <div style={{ fontSize: '1.7rem', fontWeight: 'bold', color: card.color }}>
                  {card.prefix || ''}{data.resumen[card.key]}
                </div>
                <div style={{ color: '#666', fontSize: '0.82rem', marginTop: '4px' }}>
                  {card.label}
                </div>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={handleBusquedaChange} // 🆕 Actualizado
              style={{
                padding: '8px 14px', borderRadius: '6px',
                border: '1px solid #cce5ff', width: '280px', fontSize: '1rem'
              }}
            />
            <select
              value={filtroEstado}
              onChange={handleFiltroEstadoChange} // 🆕 Actualizado
              style={{
                padding: '8px 14px', borderRadius: '6px',
                border: '1px solid #cce5ff', fontSize: '1rem'
              }}
            >
              <option value="Todos">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          {/* Tabla */}
          <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 1px 6px #cce5ff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#e8f7ff' }}>
                  {['Código', 'Nombre', 'Descripción', 'Stock', 'Costo', 'P.V.P', 'IVA', 'Estado', 'Valor Inventario'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      color: '#00aaff', fontWeight: '700',
                      fontSize: '0.9rem', whiteSpace: 'nowrap'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{
                      textAlign: 'center', padding: '32px',
                      color: '#888', fontStyle: 'italic'
                    }}>
                      No se encontraron productos
                    </td>
                  </tr>
                ) : (
                  productosPaginados.map((p, i) => {
                    const sinStock  = Number(p.stock_actual) === 0;
                    const stockBajo = Number(p.stock_actual) > 0 && Number(p.stock_actual) < 5;
                    return (
                      <tr key={p.codigo} style={{
                        borderBottom: '1px solid #e0f0ff',
                        background: sinStock
                          ? '#fff5f5'
                          : i % 2 === 0 ? '#fff' : '#f9fdff',
                        opacity: p.estado === 'Inactivo' ? 0.6 : 1
                      }}>
                        <td style={{ padding: '10px 14px', color: '#555', fontFamily: 'monospace' }}>
                          {p.codigo}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: '500' }}>
                          {p.nombre}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#777', fontSize: '0.9rem', maxWidth: '180px' }}>
                          {p.descripcion || '—'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            fontWeight: 'bold', fontSize: '1rem',
                            color: sinStock ? '#dc3545' : stockBajo ? '#fd7e14' : '#28a745'
                          }}>
                            {p.stock_actual}
                          </span>
                          {sinStock  && <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: '#dc3545' }}>⚠ Sin stock</span>}
                          {stockBajo && <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: '#fd7e14' }}>⚠ Bajo</span>}
                        </td>
                        <td style={{ padding: '10px 14px' }}>${Number(p.costo).toFixed(2)}</td>
                        <td style={{ padding: '10px 14px' }}>${Number(p.pvp).toFixed(2)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {p.graba_iva
                            ? <span style={{ color: '#28a745', fontWeight: '600' }}>Sí</span>
                            : <span style={{ color: '#888' }}>No</span>
                          }
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            background: p.estado === 'Activo' ? '#d4edda' : '#e2e3e5',
                            color:      p.estado === 'Activo' ? '#155724' : '#555',
                            padding: '2px 10px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '600'
                          }}>
                            {p.estado}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 'bold', color: '#00aaff' }}>
                          ${Number(p.valor_inventario).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Controles de paginación */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '10px'
          }}>
            <span style={{ color: '#888', fontSize: '0.85rem' }}>
              Mostrando {productosFiltrados.length === 0 ? 0 : indiceInicio + 1}–
              {Math.min(paginaActual * FILAS_POR_PAGINA, productosFiltrados.length)} de {productosFiltrados.length} productos
            </span>

            {totalPaginas > 1 && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  style={{
                    padding: '6px 14px', borderRadius: '6px',
                    border: '1px solid #cce5ff', background: '#fff',
                    color: '#00aaff', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer',
                    opacity: paginaActual === 1 ? 0.5 : 1, fontSize: '0.9rem'
                  }}
                >
                  ‹ Anterior
                </button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => setPaginaActual(num)}
                    style={{
                      padding: '6px 12px', borderRadius: '6px',
                      border: '1px solid #cce5ff',
                      background: paginaActual === num ? '#00aaff' : '#fff',
                      color: paginaActual === num ? '#fff' : '#00aaff',
                      fontWeight: paginaActual === num ? 'bold' : 'normal',
                      cursor: 'pointer', fontSize: '0.9rem', minWidth: '36px'
                    }}
                  >
                    {num}
                  </button>
                ))}

                <button
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  style={{
                    padding: '6px 14px', borderRadius: '6px',
                    border: '1px solid #cce5ff', background: '#fff',
                    color: '#00aaff', cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer',
                    opacity: paginaActual === totalPaginas ? 0.5 : 1, fontSize: '0.9rem'
                  }}
                >
                  Siguiente ›
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}