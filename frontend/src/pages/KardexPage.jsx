import { useState, useEffect } from 'react';
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

  const handleBuscar = async () => {
    if (!codigoSel) return;
    setLoading(true);
    setError('');
    setKardex(null);
    try {
      const data = await getKardex(codigoSel);
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
        <h2 style={{ margin: 0, color: '#1a1a1a', fontWeight: '800', fontSize: '22px', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
          📊 Reporte de Kardex
        </h2>
      </div>

      {/* Buscador con autocompletado */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', minWidth: '340px', flex: 1 }}>
          <input
            type="text"
            value={busqueda}
            placeholder="🔍 Buscar producto por nombre o código..."
            onChange={e => { setBusqueda(e.target.value); setCodigoSel(''); setMostrarLista(true); }}
            onFocus={() => setMostrarLista(true)}
            onBlur={() => setTimeout(() => setMostrarLista(false), 150)}
            style={{
              padding: '10px 14px', borderRadius: '8px',
              border: '1.5px solid #e0e0e0', width: '100%',
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
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

        <button
          onClick={handleBuscar}
          disabled={!codigoSel || loading}
          style={{
            background: !codigoSel || loading ? '#e0e0e0' : '#d10a11',
            color: !codigoSel || loading ? '#999' : '#fff',
            border: 'none', borderRadius: '8px', padding: '10px 28px',
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: '700', cursor: !codigoSel || loading ? 'not-allowed' : 'pointer',
            fontSize: '14px', transition: 'all 0.22s ease',
            boxShadow: !codigoSel || loading ? 'none' : '0 2px 8px rgba(209,10,17,0.28)'
          }}
        >
          {loading ? '⏳ Buscando...' : '🔍 Ver Kardex'}
        </button>
      </div>

      {error && <AlertMessage texto={error} tipo="error" onClose={() => setError('')} />}
      {loading && (
        <p style={{ color: '#d10a11', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #d10a11', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Cargando kardex...
        </p>
      )}

      {kardex && !loading && (
        <div style={{ animation: 'fadeIn 0.35s ease both' }}>

          {/* Ficha del producto */}
          <div style={{
            background: '#fff', borderRadius: '12px',
            padding: '20px 24px', marginBottom: '20px',
            display: 'flex', gap: '32px', flexWrap: 'wrap',
            borderLeft: '4px solid #d10a11',
            boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
            border: '1px solid #e0e0e0',
            borderLeftColor: '#d10a11'
          }}>
            {[
              { label: 'Producto', value: kardex.producto?.nombre },
              { label: 'Código', value: kardex.producto?.codigo },
              { label: 'Costo', value: `$${Number(kardex.producto?.costo || 0).toFixed(2)}` },
              { label: 'P.V.P', value: `$${Number(kardex.producto?.pvp || 0).toFixed(2)}` },
              { label: 'Stock Inicial', value: kardex.stock_inicial },
              { label: 'Movimientos', value: kardex.total_movimientos },
            ].map(item => (
              <div key={item.label}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>{item.label}</span>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>{item.value}</span>
              </div>
            ))}
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Stock Actual</span>
              <span style={{ color: '#d10a11', fontWeight: '800', fontSize: '20px' }}>{kardex.stock_final}</span>
            </div>
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
                {(!kardex.movimientos || kardex.movimientos.length === 0) ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#999', fontStyle: 'italic' }}>
                      Este producto no tiene movimientos registrados
                    </td>
                  </tr>
                ) : (
                  kardex.movimientos.map((mov, i) => {
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
                        <td style={{ padding: '11px 14px', fontWeight: '700', color: Number(mov.cantidad) < 0 ? '#a80008' : '#1a7a1a', fontSize: '14px' }}>
                          {Number(mov.cantidad) > 0 ? `+${mov.cantidad}` : mov.cantidad}
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

        </div>
      )}
    </div>
  );
}
