import React, { useState } from 'react';

const ProductoList = ({ productos, onEdit, onDesactivar }) => {
    const [expandedRow, setExpandedRow] = useState(null);

    const toggleRow = (codigo) => {
        if (expandedRow === codigo) {
            setExpandedRow(null);
        } else {
            setExpandedRow(codigo);
        }
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
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Stock</th>
                        <th>Costo</th>
                        <th>P.V.P</th>
                        <th>IVA</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {productos.map(producto => (
                        <React.Fragment key={producto.codigo}>
                            <tr className={producto.estado === 'Inactivo' ? 'row-inactive' : ''}>
                                <td>{producto.codigo}</td>
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
                                <td className="actions-cell">
                                    <button className="btn btn-icon btn-edit" onClick={() => onEdit(producto)} title="Editar">
                                        Editar
                                    </button>
                                    {producto.estado === 'Activo' && (
                                        <button 
                                            className="btn btn-icon btn-deactivate" 
                                            onClick={() => onDesactivar(producto.codigo)} 
                                            title="Desactivar"
                                        >
                                            Desactivar
                                        </button>
                                    )}
                                    <button 
                                        className="btn btn-icon" 
                                        style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}
                                        onClick={() => toggleRow(producto.codigo)} 
                                        title="Ver Detalles"
                                    >
                                        {expandedRow === producto.codigo ? 'Ocultar' : 'Detalles'}
                                    </button>
                                </td>
                            </tr>
                            {expandedRow === producto.codigo && (
                                <tr className="details-row">
                                    <td colSpan="8" style={{ backgroundColor: 'rgba(0, 180, 216, 0.03)', padding: '15px 20px', borderLeft: '4px solid var(--primary-color)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <strong style={{ color: 'var(--primary-hover)' }}>Descripción del Producto:</strong>
                                            <p style={{ margin: 0, color: 'var(--text-primary)', fontStyle: producto.descripcion ? 'normal' : 'italic' }}>
                                                {producto.descripcion ? producto.descripcion : 'No hay descripción disponible para este producto.'}
                                            </p>
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
