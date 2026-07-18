import { useState, useEffect } from 'react';
import { BarChart2, Search, Calendar, Loader2, X, AlertTriangle } from 'lucide-react';
import { getProductos, getKardex } from '../services/reportesService';
import AlertMessage from '../components/AlertMessage';

const TIPO_COLORES = {
  COMPRA: { bg: 'rgba(34,139,34,0.12)', text: '#1a7a1a' },
  VENTA:  { bg: 'rgba(209,10,17,0.10)', text: '#a80008' },
  AJUSTE: { bg: 'rgba(245,158,11,0.12)', text: '#92400e' },
};

export default function KardexPage() {
  const [productos,    setProductos]   = useState([]);
  const [codigoSel,   setCodigoSel]   = useState('');
  const [kardex,      setKardex]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [busqueda,    setBusqueda]    = useState('');
  const [mostrarLista,setMostrarLista]= useState(false);

  // Filtros de fecha
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin,    setFechaFin]    = useState('');
  const [errorFecha,  setErrorFecha]  = useState('');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

  useEffect(() => {
    getProductos()
      .then(setProductos)
      .catch(() => setError('No se pudieron cargar los productos'));
  }, []);

  const productosFiltrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const seleccionarProducto = (producto) => {
    setCodigoSel(producto.codigo);
    setBusqueda(`${producto.codigo} — ${producto.nombre}`);
    setMostrarLista(false);
  };

  // Limpiar todas las fechas
  const limpiarFechas = () => {
    setFechaInicio('');
    setFechaFin('');
    setErrorFecha('');
  };

  const handleBuscar = async () => {
    if (!codigoSel) return;

    // Validar rango de fechas
    setErrorFecha('');
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      setErrorFecha('La fecha de inicio no puede ser mayor a la fecha fin.');
      return;
    }

    setLoading(true);
    setError('');
    setKardex(null);
    setPaginaActual(1); // Resetear paginación al buscar
    try {
      const data = await getKardex(codigoSel, fechaInicio, fechaFin);
      setKardex(data);
    } catch {
      setError('Error al obtener el kardex del producto');
    } finally {
      setLoading(false);
    }
  };

  const pageStyle = { padding: '30px 32px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.35s ease both' };

  return (
    <div style={pageStyle}>

      {/* Título */}
      <div style={{ marginBottom: '28px', paddingBottom: '18px', borderBottom: '2px solid #e0e0e0', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: '-2px', left: 0, width: '60px', height: '2px', backgroundColor: '#d10a11', borderRadius: '2px' }} />
        <h2 style={{ margin: 0, color: '#1a1a1a', fontWeight: '800', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={26} color="#d10a11" /> Reporte de Kardex
        </h2>
      </div>

      {/* Buscador con autocompletado y Filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-end', flexWrap: 'wrap', padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ position: 'relative', minWidth: '340px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginLeft: '4px' }}>Producto</label>
          <input
            type="text"
            value={busqueda}
            placeholder="Buscar producto por nombre o código..."
            onChange={e => { setBusqueda(e.target.value); setCodigoSel(''); setMostrarLista(true); }}
            onFocus={() => setMostrarLista(true)}
            onBlur={() => setTimeout(() => setMostrarLista(false), 150)}
            style={{
              padding: '10px 14px', borderRadius: '8px',
              border: '1.5px solid #e0e0e0', width: '100%',
              fontSize: '14px', boxSizing: 'border-box',
              color: '#1a1a1a', background: '#fafafa',
              transition: 'all 0.22s ease'
            }}
            onFocusCapture={e => { e.target.style.borderColor = '#d10a11'; e.target.style.boxShadow = '0 0 0 3px rgba(209,10,17,0.12)'; e.target.style.background = '#fff'; }}
            onBlurCapture={e => { e.target.style.borderColor = '#e0e0e0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; }}
          />

          {mostrarLista && busqueda && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: '#fff', border: '1px solid #e0e0e0',
              borderRadius: '8px', marginTop: '4px',
              maxHeight: '240px', overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 10
            }}>
              {productosFiltrados.length === 0 ? (
                <div style={{ padding: '12px 14px', color: '#999', fontStyle: 'italic', fontSize: '13px' }}>
                  No se encontraron productos
                </div>
              ) : (
                productosFiltrados.map(p => (
                  <div
                    key={p.codigo}
                    onClick={() => seleccionarProducto(p)}
                    style={{
                      padding: '10px 14px', cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', fontSize: '13px',
                      transition: 'background 0.15s'
                    }}
                    onMouseDown={e => e.preventDefault()}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(209,10,17,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <span>
                      <strong style={{ color: '#d10a11' }}>{p.codigo}</strong> — {p.nombre}
                    </span>
                    <span style={{
                      fontSize: '11px', color: '#666',
                      background: '#f5f5f5', padding: '2px 8px', borderRadius: '10px', fontWeight: '600'
                    }}>
                      Stock: {p.stock_actual}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Fecha Inicio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginLeft: '4px' }}>Desde</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
            style={{
              padding: '9px 12px', borderRadius: '8px',
              border: `1.5px solid ${errorFecha ? '#d10a11' : '#e0e0e0'}`,
              fontSize: '14px', color: '#333', cursor: 'pointer',
              background: '#fafafa', height: '40px', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Fecha Fin */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginLeft: '4px' }}>Hasta</label>
          <input
            type="date"
            value={fechaFin}
            onChange={e => setFechaFin(e.target.value)}
            style={{
              padding: '9px 12px', borderRadius: '8px',
              border: `1.5px solid ${errorFecha ? '#d10a11' : '#e0e0e0'}`,
              fontSize: '14px', color: '#333', cursor: 'pointer',
              background: '#fafafa', height: '40px', boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '2px' }}>
          {(fechaInicio || fechaFin) && (
            <button
              onClick={limpiarFechas}
              style={{
                background: 'transparent', color: '#888',
                border: '1.5px solid #ddd', borderRadius: '8px',
                padding: '0 14px', cursor: 'pointer',
                fontSize: '13px', height: '40px', boxSizing: 'border-box'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><X size={14} /> Limpiar</span>
            </button>
          )}

          <button
            onClick={handleBuscar}
            disabled={!codigoSel || loading}
            style={{
              background: !codigoSel || loading ? '#e0e0e0' : '#d10a11',
              color: !codigoSel || loading ? '#999' : '#fff',
              border: 'none', borderRadius: '8px', padding: '0 28px',
              fontWeight: '700', cursor: !codigoSel || loading ? 'not-allowed' : 'pointer',
              fontSize: '14px', transition: 'all 0.22s ease',
              boxShadow: !codigoSel || loading ? 'none' : '0 2px 8px rgba(209,10,17,0.28)',
              height: '40px', boxSizing: 'border-box'
            }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Buscando...</span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Search size={16} /> Ver Kardex</span>
          )}
        </button>
        </div>
      </div>

      {errorFecha && (
        <p style={{
          color: '#d10a11', background: 'rgba(209,10,17,0.1)',
          padding: '8px 14px', borderRadius: '6px',
          fontSize: '13px', marginBottom: '12px', marginTop: '4px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={14} /> {errorFecha}</span>
        </p>
      )}

      {error && <AlertMessage texto={error} tipo="error" onClose={() => setError('')} />}
      {loading && (
        <p style={{ color: '#d10a11', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #d10a11', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Cargando kardex...
        </p>
      )}

      {kardex && !loading && (
        <div style={{ animation: 'fadeIn 0.35s ease both' }}>
          {(() => {
            const movimientosList = kardex.movimientos || [];
            const totalPaginas = Math.max(1, Math.ceil(movimientosList.length / itemsPorPagina));
            const indiceInicio = (paginaActual - 1) * itemsPorPagina;
            const movimientosPaginados = movimientosList.slice(indiceInicio, indiceInicio + itemsPorPagina);

            return (
              <>

          {/* Ficha del producto */}
          <div style={{
            background: '#fff', borderRadius: '12px',
            padding: '20px', marginBottom: '20px',
            display: 'flex', gap: '12px', flexWrap: 'wrap',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            border: '1px solid #e0e0e0'
          }}>
            {[
              { label: 'Producto', value: kardex.producto?.nombre, flex: '2 1 200px' },
              { label: 'Código', value: kardex.producto?.codigo },
              { label: 'Costo', value: `$${Number(kardex.producto?.costo || 0).toFixed(2)}` },
              { label: 'P.V.P', value: `$${Number(kardex.producto?.pvp || 0).toFixed(2)}` },
              { label: 'Stock Inicial', value: kardex.stock_inicial },
              { label: 'Movimientos', value: kardex.total_movimientos },
            ].map(item => (
              <div key={item.label} style={{
                background: '#fafafa', border: '1px solid #eee',
                padding: '12px 16px', borderRadius: '8px',
                flex: item.flex || '1 1 auto', minWidth: '110px',
                display: 'flex', flexDirection: 'column', justifyContent: 'center'
              }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>{item.label}</span>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>{item.value}</span>
              </div>
            ))}
            <div style={{
              background: 'rgba(209,10,17,0.04)', border: '1px solid rgba(209,10,17,0.2)',
              padding: '12px 16px', borderRadius: '8px', flex: '1 1 auto', minWidth: '110px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center'
            }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#d10a11', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Stock Actual</span>
              <span style={{ color: '#d10a11', fontWeight: '800', fontSize: '20px', lineHeight: 1 }}>{kardex.stock_final}</span>
            </div>

            {/* Badge de rango de fechas aplicado */}
            {(kardex.filtros?.fechaInicio || kardex.filtros?.fechaFin) && (
              <div style={{
                width: '100%', marginTop: '8px',
                padding: '8px 14px', background: 'rgba(209,10,17,0.06)',
                borderRadius: '8px', fontSize: '13px', color: '#d10a11',
                fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <Calendar size={14} /> Período filtrado:{' '}
                <strong>
                  {kardex.filtros.fechaInicio
                    ? new Date(kardex.filtros.fechaInicio + 'T00:00:00').toLocaleDateString('es-EC')
                    : 'desde el inicio'}
                </strong>
                {' → '}
                <strong>
                  {kardex.filtros.fechaFin
                    ? new Date(kardex.filtros.fechaFin + 'T00:00:00').toLocaleDateString('es-EC')
                    : 'hasta hoy'}
                </strong>
              </div>
            )}
          </div>

          {/* Tabla de movimientos */}
          <div style={{ overflowX: 'auto', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: '1px solid #e0e0e0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  {['Fecha', 'Tipo', 'Documento', 'Descripción', 'Cantidad', 'Costo Unit.', 'Valor Total', 'Stock'].map(h => (
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
                {(!movimientosList || movimientosList.length === 0) ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#999', fontStyle: 'italic' }}>
                      No hay movimientos en el período seleccionado
                    </td>
                  </tr>
                ) : (
                  movimientosPaginados.map((mov, i) => {
                    const color = TIPO_COLORES[mov.tipo_movimiento] || { bg: '#f5f5f5', text: '#666' };
                    return (
                      <tr key={mov.id_movimiento ?? i}
                        style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(209,10,17,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}
                      >
                        <td style={{ padding: '11px 14px', whiteSpace: 'nowrap', color: '#1a1a1a', fontSize: '13px' }}>
                          {mov.fecha ? new Date(mov.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '---'}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ background: color.bg, color: color.text, padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {mov.tipo_movimiento}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#1a1a1a', fontSize: '13px' }}>{mov.documento_referencia}</td>
                        <td style={{ padding: '11px 14px', color: '#666', fontSize: '13px', maxWidth: '200px' }}>{mov.descripcion}</td>
                        <td style={{ padding: '11px 14px', fontWeight: '700', color: ['VENTA', 'EGRESO', 'DEVOLUCION_COMPRA', 'AJUSTE_EGRESO'].includes(mov.tipo_movimiento) || Number(mov.cantidad) < 0 ? '#a80008' : '#1a7a1a', fontSize: '14px' }}>
                          {['VENTA', 'EGRESO', 'DEVOLUCION_COMPRA', 'AJUSTE_EGRESO'].includes(mov.tipo_movimiento) || Number(mov.cantidad) < 0 
                            ? `-${Math.abs(mov.cantidad)}` 
                            : `+${Math.abs(mov.cantidad)}`}
                        </td>
                        <td style={{ padding: '11px 14px', color: '#1a1a1a', fontSize: '13px' }}>${Number(mov.costo_unitario || 0).toFixed(2)}</td>
                        <td style={{ padding: '11px 14px', color: '#1a1a1a', fontSize: '13px' }}>${Number(mov.valor_total || 0).toFixed(2)}</td>
                        <td style={{ padding: '11px 14px', fontWeight: '800', color: '#d10a11', fontSize: '15px' }}>{mov.stock_resultante}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {movimientosList.length > 0 && (
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
                    Mostrando {indiceInicio + 1} a {Math.min(indiceInicio + itemsPorPagina, movimientosList.length)} de {movimientosList.length} movimientos
                </span>
            </div>
          )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}