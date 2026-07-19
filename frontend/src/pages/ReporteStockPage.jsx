import { useState, useEffect, Fragment } from 'react';
import { Package, Hash, DollarSign, AlertTriangle, TrendingDown, Lock, TrendingUp, Inbox, Check, X } from 'lucide-react';
import { getReporteStock } from '../services/reportesService';
import AlertMessage from '../components/AlertMessage';

const CARD_CONFIG = [
  { key: 'totalProductos', label: 'Total Productos', color: '#d10a11', icon: <Package size={28} /> },
  { key: 'totalUnidades', label: 'Total Unidades', color: '#1a7a1a', icon: <Hash size={28} /> },
  { key: 'valorTotal', label: 'Valor Inventario', color: '#c07000', icon: <DollarSign size={28} />, prefix: '$' },
  { key: 'sinStock', label: 'Sin Stock', color: '#a80008', icon: <AlertTriangle size={28} /> },
  { key: 'stockBajo', label: 'Stock Bajo (< 5)', color: '#b45309', icon: <TrendingDown size={28} /> },
  { key: 'inactivos', label: 'Inactivos', color: '#666666', icon: <Lock size={28} /> },
];

const inputStyle = {
  padding: '10px 14px', borderRadius: '8px',
  border: '1.5px solid #e0e0e0',
  fontSize: '14px', color: '#1a1a1a', background: '#fafafa',
  transition: 'all 0.22s ease', outline: 'none'
};

export default function ReporteStockPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('ASC');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortOrder('ASC');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
    return <span style={{ marginLeft: '4px', color: '#d10a11' }}>{sortOrder === 'ASC' ? '↑' : '↓'}</span>;
  };

  useEffect(() => {
    getReporteStock()
      .then(setData)
      .catch(() => setError('Error al cargar el reporte de stock'))
      .finally(() => setLoading(false));
  }, []);

  const handleBusquedaChange = (e) => { setBusqueda(e.target.value); setPaginaActual(1); };
  const handleFiltroEstadoChange = (e) => { setFiltroEstado(e.target.value); setPaginaActual(1); };
  const toggleRow = (codigo) => setExpandedRow(prev => prev === codigo ? null : codigo);

  let productosFiltrados = data?.productos?.filter(p => {
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === 'Todos' || p.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  }) ?? [];

  if (sortField) {
    productosFiltrados.sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'codigo':
          valA = (a.codigo || '').toLowerCase();
          valB = (b.codigo || '').toLowerCase();
          break;
        case 'nombre':
          valA = (a.nombre || '').toLowerCase();
          valB = (b.nombre || '').toLowerCase();
          break;
        case 'stock':
          valA = Number(a.stock_actual || 0);
          valB = Number(b.stock_actual || 0);
          break;
        case 'costo':
          valA = Number(a.costo || 0);
          valB = Number(b.costo || 0);
          break;
        case 'pvp':
          valA = Number(a.pvp || 0);
          valB = Number(b.pvp || 0);
          break;
        case 'iva':
          valA = a.graba_iva ? 1 : 0;
          valB = b.graba_iva ? 1 : 0;
          break;
        case 'valor_invertido':
          valA = Number(a.stock_actual || 0) * Number(a.costo || 0);
          valB = Number(b.stock_actual || 0) * Number(b.costo || 0);
          break;
        default:
          valA = 0; valB = 0;
      }
      if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
      if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });
  }

  const totalPaginas = Math.ceil(productosFiltrados.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const productosPaginados = productosFiltrados.slice(indiceInicio, indiceInicio + itemsPorPagina);

  return (
    <div style={{ padding: '30px 32px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.35s ease both' }}>

      {/* Título */}
      <div style={{ marginBottom: '28px', paddingBottom: '18px', borderBottom: '2px solid #e0e0e0', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: '-2px', left: 0, width: '60px', height: '2px', backgroundColor: '#d10a11', borderRadius: '2px' }} />
        <h2 style={{ margin: 0, color: '#1a1a1a', fontWeight: '800', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={26} color="#d10a11" /> Reporte de Stock
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
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-end', flexWrap: 'wrap', padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ position: 'relative', minWidth: '340px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginLeft: '4px' }}>Buscar Producto</label>
              <input
                type="text"
                placeholder="Nombre o código..."
                value={busqueda}
                onChange={handleBusquedaChange}
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#d10a11'; e.target.style.boxShadow = '0 0 0 3px rgba(209,10,17,0.12)'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#e0e0e0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px', paddingBottom: '2px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginLeft: '4px', visibility: 'hidden' }}>Estado</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '40px' }}>
                {[
                  { id: 'Todos', label: 'Todos' },
                  { id: 'Activo', label: 'Activos' },
                  { id: 'Inactivo', label: 'Inactivos' }
                ].map(tab => {
                  const isActive = filtroEstado === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setFiltroEstado(tab.id); setPaginaActual(1); }}
                      style={{
                        padding: '7px 16px', border: '1.5px solid #e0e0e0',
                        background: isActive ? '#d10a11' : '#fff',
                        color: isActive ? '#fff' : '#666',
                        borderColor: isActive ? '#d10a11' : '#e0e0e0',
                        borderRadius: '20px', cursor: 'pointer',
                        fontSize: '13px', fontWeight: '600',
                        boxShadow: isActive ? '0 2px 8px rgba(209,10,17,0.25)' : 'none',
                        transition: 'all 0.2s ease', height: '36px'
                      }}
                      onMouseEnter={e => {
                        if (!isActive) { e.currentTarget.style.borderColor = '#d10a11'; e.currentTarget.style.color = '#d10a11'; e.currentTarget.style.background = 'rgba(209,10,17,0.04)'; }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.color = '#666'; e.currentTarget.style.background = '#fff'; }
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
              <span style={{ color: '#666', fontSize: '13px', fontWeight: '500' }}>
                {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''} encontrado{productosFiltrados.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Tabla */}
          <div style={{ overflowX: 'auto', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: '1px solid #e0e0e0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th onClick={() => handleSort('codigo')} style={{ cursor: 'pointer', userSelect: 'none', padding: '11px 14px', textAlign: 'left', color: '#666', fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #d10a11' }}>Código {renderSortIcon('codigo')}</th>
                  <th onClick={() => handleSort('nombre')} style={{ cursor: 'pointer', userSelect: 'none', padding: '11px 14px', textAlign: 'left', color: '#666', fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #d10a11' }}>Nombre {renderSortIcon('nombre')}</th>
                  <th onClick={() => handleSort('stock')} style={{ cursor: 'pointer', userSelect: 'none', padding: '11px 14px', textAlign: 'left', color: '#666', fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #d10a11' }}>Stock {renderSortIcon('stock')}</th>
                  <th onClick={() => handleSort('costo')} style={{ cursor: 'pointer', userSelect: 'none', padding: '11px 14px', textAlign: 'left', color: '#666', fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #d10a11' }}>Costo {renderSortIcon('costo')}</th>
                  <th onClick={() => handleSort('pvp')} style={{ cursor: 'pointer', userSelect: 'none', padding: '11px 14px', textAlign: 'left', color: '#666', fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #d10a11' }}>P.V.P {renderSortIcon('pvp')}</th>
                  <th onClick={() => handleSort('iva')} style={{ cursor: 'pointer', userSelect: 'none', padding: '11px 14px', textAlign: 'left', color: '#666', fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #d10a11' }}>IVA {renderSortIcon('iva')}</th>
                  <th style={{ padding: '11px 14px', textAlign: 'left', color: '#666', fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #d10a11' }}>Estado</th>
                  <th onClick={() => handleSort('valor_invertido')} style={{ cursor: 'pointer', userSelect: 'none', padding: '11px 14px', textAlign: 'left', color: '#666', fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #d10a11' }}>Valor en Inventario {renderSortIcon('valor_invertido')}</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#999', fontStyle: 'italic' }}>
                      <Inbox size={48} style={{ display: 'block', margin: '0 auto 10px', color: '#ccc' }} /> No se encontraron productos con ese criterio
                    </td>
                  </tr>
                ) : (
                  productosPaginados.map((p, i) => {
                    const sinStock = Number(p.stock_actual) === 0;
                    const stockBajo = Number(p.stock_actual) > 0 && Number(p.stock_actual) < 5;
                    return (
                      <Fragment key={p.codigo}>
                        <tr style={{
                          borderBottom: '1px solid #f0f0f0',
                          background: p.estado === 'Inactivo' ? 'rgba(0,0,0,0.04)' : (sinStock ? 'rgba(209,10,17,0.04)' : i % 2 === 0 ? '#fff' : '#fafafa'),
                          opacity: p.estado === 'Inactivo' ? 0.6 : 1,
                          filter: p.estado === 'Inactivo' ? 'grayscale(100%)' : 'none',
                          transition: 'background 0.15s'
                        }}
                          onMouseEnter={e => { if (p.estado !== 'Inactivo') e.currentTarget.style.background = 'rgba(209,10,17,0.03)' }}
                          onMouseLeave={e => { if (p.estado !== 'Inactivo') e.currentTarget.style.background = sinStock ? 'rgba(209,10,17,0.04)' : i % 2 === 0 ? '#fff' : '#fafafa' }}
                        >
                          <td style={{ padding: '11px 14px' }}>
                            <span
                              style={{ color: '#d10a11', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => toggleRow(p.codigo)}
                              title="Ver Descripción"
                            >
                              {p.codigo}
                            </span>
                          </td>
                          <td style={{ padding: '11px 14px', fontWeight: '600', color: '#1a1a1a', fontSize: '13px' }}>{p.nombre}</td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ fontWeight: '800', fontSize: '15px', color: sinStock ? '#a80008' : stockBajo ? '#b45309' : '#1a7a1a' }}>
                              {p.stock_actual}
                            </span>
                            {sinStock && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#fff', background: '#d10a11', padding: '3px 8px', borderRadius: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px', boxShadow: '0 2px 4px rgba(209,10,17,0.3)', verticalAlign: 'middle' }}><AlertTriangle size={11} strokeWidth={3} /> SIN STOCK</span>}
                            {stockBajo && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#fff', background: '#b45309', padding: '3px 8px', borderRadius: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px', boxShadow: '0 2px 4px rgba(180,83,9,0.3)', verticalAlign: 'middle' }}><TrendingDown size={11} strokeWidth={3} /> STOCK BAJO</span>}
                          </td>
                          <td style={{ padding: '11px 14px', color: '#1a1a1a', fontSize: '13px' }}>${Number(p.costo).toFixed(2)}</td>
                          <td style={{ padding: '11px 14px', color: '#1a1a1a', fontSize: '13px' }}>${Number(p.pvp).toFixed(2)}</td>
                          <td style={{ padding: '11px 14px' }}>
                            {p.graba_iva
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#1a7a1a', fontWeight: '700', fontSize: '12px' }}><Check size={14} /> Sí</span>
                              : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#999', fontSize: '12px', fontWeight: '600' }}><X size={14} /> No</span>
                            }
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{
                              background: p.estado === 'Activo' ? 'rgba(34,139,34,0.12)' : '#f5f5f5',
                              color: p.estado === 'Activo' ? '#1a7a1a' : '#666',
                              padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em'
                            }}>
                              {p.estado}
                            </span>
                          </td>
                          <td style={{ padding: '11px 14px', fontWeight: '800', color: '#d10a11', fontSize: '14px' }}>
                            ${Number(p.valor_inventario).toFixed(2)}
                          </td>
                        </tr>
                        {expandedRow === p.codigo && (
                          <tr>
                            <td colSpan={8} style={{ padding: '16px 20px', backgroundColor: 'rgba(209,10,17,0.02)', borderBottom: '1px solid #f0f0f0', borderLeft: '3px solid #d10a11', animation: 'fadeIn 0.2s ease both' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#d10a11', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descripción Detallada</span>
                                <span style={{ fontSize: '13px', color: '#444', lineHeight: 1.5 }}>
                                  {p.descripcion || <em style={{ color: '#999' }}>Este producto no tiene una descripción registrada.</em>}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {productosFiltrados.length > 0 && (
            <div className="pagination-container" style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Mostrar</span>
                <select
                  value={itemsPorPagina}
                  onChange={(e) => { setItemsPorPagina(Number(e.target.value)); setPaginaActual(1); }}
                  className="modern-select"
                  style={{ padding: '4px 8px', width: 'auto' }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>registros</span>
              </div>

              <div className="pagination-controls">
                <button
                  className="pagination-button"
                  onClick={() => setPaginaActual(1)}
                  disabled={paginaActual === 1}
                >
                  «
                </button>
                <button
                  className="pagination-button"
                  onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
                  disabled={paginaActual === 1}
                >
                  Anterior
                </button>
                {Array.from({ length: totalPaginas }, (_, idx) => idx + 1).map(page => (
                  <button
                    key={page}
                    className={`pagination-button ${paginaActual === page ? 'active' : ''}`}
                    onClick={() => setPaginaActual(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="pagination-button"
                  onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente
                </button>
                <button
                  className="pagination-button"
                  onClick={() => setPaginaActual(totalPaginas)}
                  disabled={paginaActual === totalPaginas}
                >
                  »
                </button>
              </div>

              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Mostrando {indiceInicio + 1} a {Math.min(indiceInicio + itemsPorPagina, productosFiltrados.length)} de {productosFiltrados.length} registros
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
