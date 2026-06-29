import React, { useState } from 'react';

const ProductoList = ({ productos, proveedoresCatalogo = [], onEdit, onDesactivar, sortBy, sortOrder, onSort }) => {
    const [expandedRow, setExpandedRow] = useState(null);

    const toggleRow = (codigo) => {
        if (expandedRow === codigo) {
            setExpandedRow(null);
        } else {
            setExpandedRow(codigo);
        }
    };

    const getProveedoresParaProducto = (codigo) => {
        const match = proveedoresCatalogo.find(item => item.codigoProducto === codigo);
        return match ? match.proveedores : [];
    };

    const renderSortIcon = (column) => {
        if (sortBy !== column) return <span style={{ color: 'var(--text-secondary)', marginLeft: '4px', opacity: 0.3 }}>↕</span>;
        return <span style={{ color: 'var(--primary-color)', marginLeft: '4px' }}>{sortOrder === 'ASC' ? '↑' : '↓'}</span>;
    };

    if (!productos || productos.length === 0) {
        return (
            <div className="empty-state">
                <p>No hay productos registrados.</p>
            </div>
        );
    }

    return (
        <div className="table-container card">
            <table className="modern-table">
                <thead>
                    <tr>
                        <th style={{ width: '70px', textAlign: 'center' }}>Acciones</th>
                        <th onClick={() => onSort('codigo')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                            Código {renderSortIcon('codigo')}
                        </th>
                        <th>Nombre</th>
                        <th onClick={() => onSort('stock_actual')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                            Stock {renderSortIcon('stock_actual')}
                        </th>
                        <th onClick={() => onSort('costo')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                            Costo {renderSortIcon('costo')}
                        </th>
                        <th onClick={() => onSort('pvp')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                            P.V.P {renderSortIcon('pvp')}
                        </th>
                        <th>IVA</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {productos.map(producto => (
                        <React.Fragment key={producto.codigo}>
                            <tr className={producto.estado === 'Inactivo' ? 'row-inactive' : ''}>
                                <td style={{ width: '40px', textAlign: 'center', paddingRight: '0' }}>
                                    <button 
                                        className="btn btn-icon btn-edit" 
                                        onClick={() => onEdit(producto)} 
                                        title="Editar"
                                        style={{ padding: '4px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                                    >
                                        ✎
                                    </button>
                                </td>
                                <td>
                                    <span
                                        style={{
                                            color: 'var(--primary-color)',
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                            fontWeight: 'bold'
                                        }}
                                        onClick={() => toggleRow(producto.codigo)}
                                        title="Ver Detalles"
                                    >
                                        {producto.codigo}
                                    </span>
                                </td>
                                <td>{producto.nombre}</td>
                                <td>{producto.stock_actual}</td>
                                <td>${Number(producto.costo).toFixed(2)}</td>
                                <td>${Number(producto.pvp).toFixed(2)}</td>
                                <td>{producto.graba_iva ? 'Sí' : 'No'}</td>
                                <td>
                                    <span className={`badge ${producto.estado === 'Activo' ? 'badge-active' : 'badge-inactive'}`}>
                                        {producto.estado}
                                    </span>
                                </td>
                            </tr>
                            {expandedRow === producto.codigo && (
                                <tr className="details-row">
                                    <td colSpan="8" style={{ backgroundColor: 'rgba(0, 180, 216, 0.03)', padding: '15px 20px', borderLeft: '4px solid var(--primary-color)' }}>
                                        <div style={{ display: 'flex', gap: '40px' }}>
                                            {/* Columna Descripción */}
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <strong style={{ color: 'var(--primary-hover)' }}>Descripción del Producto:</strong>
                                                <p style={{ margin: 0, color: 'var(--text-primary)', fontStyle: producto.descripcion ? 'normal' : 'italic' }}>
                                                    {producto.descripcion ? producto.descripcion : 'No hay descripción disponible para este producto.'}
                                                </p>
                                            </div>

                                            {/* Columna Proveedores */}
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <strong style={{ color: 'var(--primary-hover)' }}>Proveedores:</strong>
                                                {(() => {
                                                    const proveedores = getProveedoresParaProducto(producto.codigo);
                                                    if (proveedores.length === 0) {
                                                        return <p style={{ margin: 0, color: 'var(--text-secondary)', fontStyle: 'italic' }}>No hay proveedores registrados.</p>;
                                                    }
                                                    return (
                                                        <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)' }}>
                                                            {proveedores.map(prov => (
                                                                <li key={prov.proveedorId} style={{ marginBottom: '4px' }}>
                                                                    <strong>{prov.nombre}</strong> (RUC: {prov.cedulaRuc}) - Precio: <span style={{ color: 'var(--success-color)' }}>${prov.precioCompra.toFixed(2)}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductoList;
