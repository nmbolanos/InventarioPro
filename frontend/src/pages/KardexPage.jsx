import { useState, useEffect } from 'react';
import { getProductos, getKardex } from '../services/reportesService';

// Colores por tipo de movimiento
const TIPO_COLORES = {
  COMPRA: { bg: '#d4edda', text: '#155724' },
  VENTA:  { bg: '#f8d7da', text: '#721c24' },
  AJUSTE: { bg: '#fff3cd', text: '#856404' },
};

export default function KardexPage() {
  const [productos,   setProductos]   = useState([]);
  const [codigoSel,  setCodigoSel]   = useState('');
  const [kardex,     setKardex]      = useState(null);
  const [loading,    setLoading]     = useState(false);
  const [error,      setError]       = useState('');

  useEffect(() => {
    getProductos()
      .then(setProductos)
      .catch(() => setError('No se pudieron cargar los productos'));
  }, []);

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

  return (
    <div style={{ padding: '24px' }}>

      {/* Título */}
      <h2 style={{ color: '#00aaff', fontWeight: 'bold', fontSize: '1.6rem', marginBottom: '20px' }}>
        Reporte de Kardex
      </h2>

      {/* Selector */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={codigoSel}
          onChange={e => setCodigoSel(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: '6px',
            border: '1px solid #cce5ff', minWidth: '300px', fontSize: '1rem'
          }}
        >
          <option value="">-- Seleccione un producto --</option>
          {productos.map(p => (
            <option key={p.codigo} value={p.codigo}>
              {p.codigo} — {p.nombre}
            </option>
          ))}
        </select>

        <button
          onClick={handleBuscar}
          disabled={!codigoSel || loading}
          style={{
            background: '#00aaff', color: '#fff', border: 'none',
            borderRadius: '6px', padding: '8px 24px',
            fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem',
            opacity: (!codigoSel || loading) ? 0.6 : 1
          }}
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error && (
        <p style={{ color: '#dc3545', background: '#f8d7da', padding: '10px 16px', borderRadius: '6px' }}>
          {error}
        </p>
      )}

      {/* Resultados */}
      {kardex && (
        <div>

          {/* Ficha del producto */}
          <div style={{
            background: '#e8f7ff', borderRadius: '10px',
            padding: '16px 24px', marginBottom: '20px',
            display: 'flex', gap: '32px', flexWrap: 'wrap',
            borderLeft: '4px solid #00aaff'
          }}>
            <div><strong style={{ color: '#555' }}>Producto:</strong> <span style={{ color: '#222' }}>{kardex.producto.nombre}</span></div>
            <div><strong style={{ color: '#555' }}>Código:</strong> <span style={{ color: '#222' }}>{kardex.producto.codigo}</span></div>
            <div><strong style={{ color: '#555' }}>Costo:</strong> <span style={{ color: '#222' }}>${Number(kardex.producto.costo).toFixed(2)}</span></div>
            <div><strong style={{ color: '#555' }}>P.V.P:</strong> <span style={{ color: '#222' }}>${Number(kardex.producto.pvp).toFixed(2)}</span></div>
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
                {kardex.movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{
                      textAlign: 'center', padding: '32px',
                      color: '#888', fontStyle: 'italic'
                    }}>
                      Este producto no tiene movimientos registrados
                    </td>
                  </tr>
                ) : (
                  kardex.movimientos.map((mov, i) => {
                    const color = TIPO_COLORES[mov.tipo_movimiento] || { bg: '#e2e3e5', text: '#555' };
                    return (
                      <tr key={mov.id_movimiento}
                        style={{
                          borderBottom: '1px solid #e0f0ff',
                          background: i % 2 === 0 ? '#fff' : '#f9fdff'
                        }}
                      >
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#555' }}>
                          {new Date(mov.fecha).toLocaleDateString('es-EC', {
                            day: '2-digit', month: '2-digit', year: 'numeric'
                          })}
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
                          ${Number(mov.costo_unitario).toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          ${Number(mov.valor_total).toFixed(2)}
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