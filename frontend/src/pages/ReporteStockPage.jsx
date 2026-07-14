import { useState, useEffect } from 'react';
import { getReporteStock } from '../services/reportesService';
import AlertMessage from '../components/AlertMessage';

const CARD_CONFIG = [
  { key: 'totalProductos', label: 'Total Productos',   color: '#d10a11', icon: '📦' },
  { key: 'totalUnidades',  label: 'Total Unidades',    color: '#1a7a1a', icon: '🔢' },
  { key: 'valorTotal',     label: 'Valor Inventario',  color: '#c07000', icon: '💰', prefix: '$' },
  { key: 'sinStock',       label: 'Sin Stock',         color: '#a80008', icon: '⚠️' },
  { key: 'stockBajo',      label: 'Stock Bajo (< 5)',  color: '#b45309', icon: '📉' },
  { key: 'inactivos',      label: 'Inactivos',         color: '#666666', icon: '🔒' },
];

const inputStyle = {
  padding: '10px 14px', borderRadius: '8px',
  border: '1.5px solid #e0e0e0',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize: '14px', color: '#1a1a1a', background: '#fafafa',
  transition: 'all 0.22s ease', outline: 'none'
};

export default function ReporteStockPage() {
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [busqueda,     setBusqueda]     = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const FILAS_POR_PAGINA = 10;

  useEffect(() => {
    getReporteStock()
      .then(setData)
      .catch(() => setError('Error al cargar el reporte de stock'))
      .finally(() => setLoading(false));
  }, []);

  const handleBusquedaChange = (e) => { setBusqueda(e.target.value); setPaginaActual(1); };
  const handleFiltroEstadoChange = (e) => { setFiltroEstado(e.target.value); setPaginaActual(1); };

  const productosFiltrados = data?.productos?.filter(p => {
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === 'Todos' || p.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  }) ?? [];

  const totalPaginas = Math.ceil(productosFiltrados.length / FILAS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const productosPaginados = productosFiltrados.slice(indiceInicio, indiceInicio + FILAS_POR_PAGINA);

  return (
    <div style={{ padding: '30px 32px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.35s ease both' }}>

      {/* Título */}
      <div style={{ marginBottom: '28px', paddingBottom: '18px', borderBottom: '2px solid #e0e0e0', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: '-2px', left: 0, width: '60px', height: '2px', backgroundColor: '#d10a11', borderRadius: '2px' }} />
        <h2 style={{ margin: 0, color: '#1a1a1a', fontWeight: '800', fontSize: '22px', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
          📈 Reporte de Stock
        </h2>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#d10a11', fontWeight: '600', padding: '20px 0' }}>
          <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #d10a11', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Cargando reporte...
        </div>
      )}
      <AlertMessage texto={error} tipo="error" onClose={() => setError('')} />

      {data && (
        <>
          {/* Tarjetas resumen */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
            {CARD_CONFIG.map(card => (
              <div key={card.key} style={{
                background: '#fff', borderRadius: '12px',
                padding: '16px 20px', flex: '1 1 140px', textAlign: 'center',
                borderTop: `4px solid ${card.color}`,
                boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                border: '1px solid #e0e0e0',
                borderTopColor: card.color,
                transition: 'transform 0.2s, box-shadow 0.2s',
                animation: 'fadeIn 0.4s ease both'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.07)'; }}
              >
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>{card.icon}</div>
                <div style={{ fontSize: '1.9rem', fontWeight: '800', color: card.color, lineHeight: 1 }}>
                  {card.prefix || ''}{data.resumen[card.key]}
                </div>
                <div style={{ color: '#666', fontSize: '11px', marginTop: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {card.label}
                </div>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center', padding: '14px 18px', background: '#fff', borderRadius: '10px', border: '1px solid #e0e0e0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por nombre o código..."
              value={busqueda}
              onChange={handleBusquedaChange}
              style={{ ...inputStyle, width: '280px' }}
              onFocus={e => { e.target.style.borderColor = '#d10a11'; e.target.style.boxShadow = '0 0 0 3px rgba(209,10,17,0.12)'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#e0e0e0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; }}
            />
            <select
              value={filtroEstado}
              onChange={handleFiltroEstadoChange}
              style={{ ...inputStyle, width: '180px', cursor: 'pointer' }}
              onFocus={e => { e.target.style.borderColor = '#d10a11'; e.target.style.boxShadow = '0 0 0 3px rgba(209,10,17,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#e0e0e0'; e.target.style.boxShadow = 'none'; }}
            >
              <option value="Todos">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
            <span style={{ marginLeft: 'auto', color: '#666', fontSize: '13px', fontWeight: '500' }}>
              {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''} encontrado{productosFiltrados.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Tabla */}
          <div style={{ overflowX: 'auto', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: '1px solid #e0e0e0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  {['Código', 'Nombre', 'Descripción', 'Stock', 'Costo', 'P.V.P', 'IVA', 'Estado', 'Valor Inv.'].map(h => (
                    <th key={h} style={{
                      padding: '11px 14px', textAlign: 'left',
                      color: '#666', fontWeight: '700',
                      fontSize: '11px', whiteSpace: 'nowrap',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '2px solid #d10a11'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#999', fontStyle: 'italic' }}>
                      📦 No se encontraron productos con ese criterio
                    </td>
                  </tr>
                ) : (
                  productosPaginados.map((p, i) => {
                    const sinStock  = Number(p.stock_actual) === 0;
                    const stockBajo = Number(p.stock_actual) > 0 && Number(p.stock_actual) < 5;
                    return (
                      <tr key={p.codigo} style={{
                        borderBottom: '1px solid #f0f0f0',
                        background: sinStock ? 'rgba(209,10,17,0.04)' : i % 2 === 0 ? '#fff' : '#fafafa',
                        opacity: p.estado === 'Inactivo' ? 0.6 : 1,
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(209,10,17,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = sinStock ? 'rgba(209,10,17,0.04)' : i % 2 === 0 ? '#fff' : '#fafafa'}
                      >
                        <td style={{ padding: '11px 14px', color: '#d10a11', fontFamily: 'monospace', fontWeight: '700', fontSize: '13px' }}>{p.codigo}</td>
                        <td style={{ padding: '11px 14px', fontWeight: '600', color: '#1a1a1a', fontSize: '13px' }}>{p.nombre}</td>
                        <td style={{ padding: '11px 14px', color: '#666', fontSize: '12px', maxWidth: '160px' }}>{p.descripcion || '—'}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontWeight: '800', fontSize: '15px', color: sinStock ? '#a80008' : stockBajo ? '#b45309' : '#1a7a1a' }}>
                            {p.stock_actual}
                          </span>
                          {sinStock  && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#a80008', background: 'rgba(209,10,17,0.1)', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>SIN STOCK</span>}
                          {stockBajo && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#b45309', background: 'rgba(180,83,9,0.1)', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>BAJO</span>}
                        </td>
                        <td style={{ padding: '11px 14px', color: '#1a1a1a', fontSize: '13px' }}>${Number(p.costo).toFixed(2)}</td>
                        <td style={{ padding: '11px 14px', color: '#1a1a1a', fontSize: '13px' }}>${Number(p.pvp).toFixed(2)}</td>
                        <td style={{ padding: '11px 14px' }}>
                          {p.graba_iva
                            ? <span style={{ color: '#1a7a1a', fontWeight: '700', fontSize: '12px' }}>✓ Sí</span>
                            : <span style={{ color: '#999', fontSize: '12px' }}>No</span>
                          }
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{
                            background: p.estado === 'Activo' ? 'rgba(34,139,34,0.12)' : '#f5f5f5',
                            color:      p.estado === 'Activo' ? '#1a7a1a' : '#666',
                            padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em'
                          }}>
                            {p.estado}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', fontWeight: '800', color: '#d10a11', fontSize: '14px' }}>
                          ${Number(p.valor_inventario).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ color: '#666', fontSize: '13px', fontWeight: '500' }}>
              Mostrando {productosFiltrados.length === 0 ? 0 : indiceInicio + 1}–{Math.min(paginaActual * FILAS_POR_PAGINA, productosFiltrados.length)} de {productosFiltrados.length}
            </span>

            {totalPaginas > 1 && (
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <button
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff', color: paginaActual === 1 ? '#ccc' : '#d10a11', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}
                >
                  ‹ Ant
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => setPaginaActual(num)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid', borderColor: paginaActual === num ? '#d10a11' : '#e0e0e0', background: paginaActual === num ? '#d10a11' : '#fff', color: paginaActual === num ? '#fff' : '#666', fontWeight: paginaActual === num ? '700' : '500', cursor: 'pointer', fontSize: '13px', minWidth: '36px', transition: 'all 0.2s' }}
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff', color: paginaActual === totalPaginas ? '#ccc' : '#d10a11', cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}
                >
                  Sig ›
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
