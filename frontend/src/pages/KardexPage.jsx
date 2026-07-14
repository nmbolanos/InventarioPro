import { useState, useEffect } from 'react';
import { getProductos, getKardex } from '../services/reportesService';
import AlertMessage from '../components/AlertMessage';

// Colores por tipo de movimiento
const TIPO_COLORES = {
  COMPRA: { bg: '#d4edda', text: '#155724' },
  VENTA:  { bg: '#f8d7da', text: '#721c24' },
  AJUSTE: { bg: '#fff3cd', text: '#856404' },
};

export default function KardexPage() {
  const [productos,    setProductos]   = useState([]);
  const [codigoSel,   setCodigoSel]   = useState('');
  const [kardex,      setKardex]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  // Buscador con autocompletado
  const [busqueda,     setBusqueda]     = useState('');
  const [mostrarLista, setMostrarLista] = useState(false);

  // Filtros de fecha
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin,    setFechaFin]    = useState('');
  const [errorFecha,  setErrorFecha]  = useState('');

  useEffect(() => {
    getProductos()
      .then(setProductos)
      .catch(() => setError('No se pudieron cargar los productos'));
  }, []);

  // Productos filtrados por nombre o código
  const productosFiltrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Seleccionar producto de la lista
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
    try {
      const data = await getKardex(codigoSel, fechaInicio, fechaFin);
      setKardex(data);
    } catch {
      setError('Error al obtener el kardex del producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>

      {/* Título */}
      <h2 style={{ color: '#00aaff', fontWeight: 'bold', fontSize: '1.6rem', marginBottom: '20px' }}>
        Reporte de Kardex
      </h2>

      {/* ── Fila de filtros ── */}
      <div style={{
        display: 'flex', gap: '12px', marginBottom: '8px',
        alignItems: 'flex-end', flexWrap: 'wrap'
      }}>

        {/* Buscador autocompletado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.78rem', color: '#555', fontWeight: '600' }}>
            Producto
          </label>
          <div style={{ position: 'relative', minWidth: '300px' }}>
            <input
              type="text"
              value={busqueda}
              placeholder="Buscar por nombre o código..."
              onChange={e => {
                setBusqueda(e.target.value);
                setCodigoSel('');
                setMostrarLista(true);
              }}
              onFocus={() => setMostrarLista(true)}
              onBlur={() => setTimeout(() => setMostrarLista(false), 150)}
              style={{
                padding: '8px 14px', borderRadius: '6px',
                border: '1px solid #cce5ff', width: '100%',
                fontSize: '1rem', boxSizing: 'border-box'
              }}
            />

            {/* Lista desplegable */}
            {mostrarLista && busqueda && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: '#fff', border: '1px solid #cce5ff',
                borderRadius: '6px', marginTop: '4px',
                maxHeight: '220px', overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10
              }}>
                {productosFiltrados.length === 0 ? (
                  <div style={{ padding: '10px 14px', color: '#888', fontStyle: 'italic' }}>
                    No se encontraron productos
                  </div>
                ) : (
                  productosFiltrados.map(p => (
                    <div
                      key={p.codigo}
                      onClick={() => seleccionarProducto(p)}
                      style={{
                        padding: '10px 14px', cursor: 'pointer',
                        borderBottom: '1px solid #f0f8ff',
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', fontSize: '0.95rem'
                      }}
                      onMouseDown={e => e.preventDefault()}
                      onMouseEnter={e => e.currentTarget.style.background = '#e8f7ff'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <span>
                        <strong style={{ color: '#00aaff' }}>{p.codigo}</strong> — {p.nombre}
                      </span>
                      <span style={{
                        fontSize: '0.8rem', color: '#888',
                        background: '#f0f8ff', padding: '2px 8px', borderRadius: '10px'
                      }}>
                        Stock: {p.stock_actual}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fecha Inicio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.78rem', color: '#555', fontWeight: '600' }}>
            Fecha Inicio
          </label>
          <input
            type="date"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: '6px',
              border: `1px solid ${errorFecha ? '#dc3545' : '#cce5ff'}`,
              fontSize: '0.95rem', color: '#333', cursor: 'pointer'
            }}
          />
        </div>

        {/* Fecha Fin */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.78rem', color: '#555', fontWeight: '600' }}>
            Fecha Fin
          </label>
          <input
            type="date"
            value={fechaFin}
            onChange={e => setFechaFin(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: '6px',
              border: `1px solid ${errorFecha ? '#dc3545' : '#cce5ff'}`,
              fontSize: '0.95rem', color: '#333', cursor: 'pointer'
            }}
          />
        </div>

        {/* Botón limpiar fechas — solo aparece si hay alguna fecha seleccionada */}
        {(fechaInicio || fechaFin) && (
          <button
            onClick={limpiarFechas}
            style={{
              background: 'transparent', color: '#888',
              border: '1px solid #ddd', borderRadius: '6px',
              padding: '8px 14px', cursor: 'pointer',
              fontSize: '0.9rem', marginBottom: '1px'
            }}
          >
            ✕ Limpiar fechas
          </button>
        )}

        {/* Botón Ver Kardex */}
        <button
          onClick={handleBuscar}
          disabled={!codigoSel || loading}
          style={{
            background: '#00aaff', color: '#fff', border: 'none',
            borderRadius: '6px', padding: '8px 24px',
            fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem',
            opacity: (!codigoSel || loading) ? 0.6 : 1,
            marginBottom: '1px'
          }}
        >
          {loading ? 'Buscando...' : 'Ver Kardex'}
        </button>
      </div>

      {/* Error de validación de fechas */}
      {errorFecha && (
        <p style={{
          color: '#dc3545', background: '#f8d7da',
          padding: '8px 14px', borderRadius: '6px',
          fontSize: '0.9rem', marginBottom: '12px', marginTop: '4px'
        }}>
          ⚠ {errorFecha}
        </p>
      )}

      {/* Error general */}
      {error && (
        <AlertMessage texto={error} tipo="error" onClose={() => setError('')} />
      )}

      {/* Indicador de carga */}
      {loading && (
        <p style={{ color: '#00aaff', fontWeight: '500', marginTop: '12px' }}>
          Cargando kardex...
        </p>
      )}

      {/* ── Resultados ── */}
      {kardex && !loading && (
        <div>

          {/* Ficha del producto */}
          <div style={{
            background: '#e8f7ff', borderRadius: '10px',
            padding: '16px 24px', marginBottom: '20px', marginTop: '20px',
            display: 'flex', gap: '32px', flexWrap: 'wrap',
            borderLeft: '4px solid #00aaff'
          }}>
            <div>
              <strong style={{ color: '#555' }}>Producto:</strong>{' '}
              <span style={{ color: '#222' }}>{kardex.producto?.nombre}</span>
            </div>
            <div>
              <strong style={{ color: '#555' }}>Código:</strong>{' '}
              <span style={{ color: '#222' }}>{kardex.producto?.codigo}</span>
            </div>
            <div>
              <strong style={{ color: '#555' }}>Costo:</strong>{' '}
              <span style={{ color: '#222' }}>${Number(kardex.producto?.costo || 0).toFixed(2)}</span>
            </div>
            <div>
              <strong style={{ color: '#555' }}>P.V.P:</strong>{' '}
              <span style={{ color: '#222' }}>${Number(kardex.producto?.pvp || 0).toFixed(2)}</span>
            </div>
            <div>
              <strong style={{ color: '#555' }}>Stock Inicial:</strong>{' '}
              <span style={{ fontWeight: 'bold' }}>{kardex.stock_inicial}</span>
            </div>
            <div>
              <strong style={{ color: '#555' }}>Stock Actual:</strong>{' '}
              <span style={{ color: '#00aaff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                {kardex.stock_final}
              </span>
            </div>
            <div>
              <strong style={{ color: '#555' }}>Movimientos:</strong>{' '}
              <span>{kardex.total_movimientos}</span>
            </div>

            {/* Badge de rango de fechas aplicado */}
            {(kardex.filtros?.fechaInicio || kardex.filtros?.fechaFin) && (
              <div style={{
                width: '100%', marginTop: '8px',
                padding: '6px 12px', background: '#fff3cd',
                borderRadius: '6px', fontSize: '0.85rem', color: '#856404'
              }}>
                📅 Período filtrado:{' '}
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
          <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 1px 6px #cce5ff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#e8f7ff' }}>
                  {[
                    'Fecha', 'Tipo', 'Documento', 'Descripción',
                    'Cantidad', 'Costo Unit.', 'Valor Total', 'Stock'
                  ].map(h => (
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
                {(!kardex.movimientos || kardex.movimientos.length === 0) ? (
                  <tr>
                    <td colSpan={8} style={{
                      textAlign: 'center', padding: '32px',
                      color: '#888', fontStyle: 'italic'
                    }}>
                      No hay movimientos en el período seleccionado
                    </td>
                  </tr>
                ) : (
                  kardex.movimientos.map((mov, i) => {
                    const color = TIPO_COLORES[mov.tipo_movimiento] || { bg: '#e2e3e5', text: '#555' };
                    return (
                      <tr
                        key={mov.id_movimiento ?? i}
                        style={{
                          borderBottom: '1px solid #e0f0ff',
                          background: i % 2 === 0 ? '#fff' : '#f9fdff'
                        }}
                      >
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#555' }}>
                          {mov.fecha
                            ? new Date(mov.fecha).toLocaleDateString('es-EC', {
                                day: '2-digit', month: '2-digit', year: 'numeric'
                              })
                            : '---'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            background: color.bg, color: color.text,
                            padding: '3px 10px', borderRadius: '12px',
                            fontSize: '0.8rem', fontWeight: '700'
                          }}>
                            {mov.tipo_movimiento}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#555', fontSize: '0.9rem' }}>
                          {mov.documento_referencia}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#555', fontSize: '0.9rem', maxWidth: '200px' }}>
                          {mov.descripcion}
                        </td>
                        <td style={{
                          padding: '10px 14px', fontWeight: '600',
                          color: Number(mov.cantidad) < 0 ? '#dc3545' : '#28a745'
                        }}>
                          {Number(mov.cantidad) > 0 ? `+${mov.cantidad}` : mov.cantidad}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          ${Number(mov.costo_unitario || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          ${Number(mov.valor_total || 0).toFixed(2)}
                        </td>
                        <td style={{
                          padding: '10px 14px', fontWeight: 'bold',
                          color: '#00aaff', fontSize: '1rem'
                        }}>
                          {mov.stock_resultante}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
}