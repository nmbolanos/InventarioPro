import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    getAjustesCabecera, 
    crearAjusteCabecera, 
    crearAjusteDetalle, 
    getProductosCatalogo 
} from '../services/ajusteService';
import './AjusteProductosPage.css';

const AjusteProductosPage = () => {
    const navigate = useNavigate();

    // Form states
    const [numeroAjuste, setNumeroAjuste] = useState('AJUS-0001');
    const [fecha, setFecha] = useState(new Date().toISOString().substring(0, 10));
    const [descripcion, setDescripcion] = useState('');
    const [detalles, setDetalles] = useState([]);

    // UI/UX States
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' }); // tipo: 'exito' | 'error'
    const [erroresForm, setErroresForm] = useState({});

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [productosCatalogo, setProductosCatalogo] = useState([]);
    const [filtroBusqueda, setFiltroBusqueda] = useState('');
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidadModal, setCantidadModal] = useState('');
    const [errorModal, setErrorModal] = useState('');

    useEffect(() => {
        inicializarPagina();
    }, []);

    const inicializarPagina = async () => {
        setLoading(true);
        try {
            // 1. Obtener cabeceras existentes para calcular el siguiente número de ajuste
            const cabeceras = await getAjustesCabecera();
            const proximoNumero = calcularSiguienteNumero(cabeceras);
            setNumeroAjuste(proximoNumero);

            // 2. Cargar catálogo de productos
            const catalogo = await getProductosCatalogo();
            setProductosCatalogo(catalogo);
        } catch (error) {
            setMensaje({ 
                texto: 'Error al conectar con el servidor. Verifique si el backend está en ejecución.', 
                tipo: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    const calcularSiguienteNumero = (cabeceras) => {
        if (!cabeceras || cabeceras.length === 0) return 'AJUS-0001';
        
        const numeros = cabeceras.map(c => {
            const partes = c.numero_ajuste.split('-');
            if (partes.length === 2 && !isNaN(partes[1])) {
                return parseInt(partes[1], 10);
            }
            return 0;
        });
        
        const max = Math.max(...numeros);
        const siguiente = max + 1;
        return `AJUS-${String(siguiente).padStart(4, '0')}`;
    };

    const handleOpenModal = async () => {
        setErrorModal('');
        setFiltroBusqueda('');
        setProductoSeleccionado(null);
        setCantidadModal('');
        
        // Recargar catálogo antes de abrir para tener stocks frescos
        try {
            const catalogo = await getProductosCatalogo();
            setProductosCatalogo(catalogo);
        } catch (err) {
            console.error('Error al actualizar catálogo de productos:', err);
        }
        
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleSeleccionarProducto = (prod) => {
        setProductoSeleccionado(prod);
        setErrorModal('');
        setCantidadModal('');
    };

    const handleAgregarDetalle = () => {
        if (!productoSeleccionado) {
            setErrorModal('Debe seleccionar un producto del catálogo.');
            return;
        }

        const cantidad = parseInt(cantidadModal, 10);
        if (isNaN(cantidad) || cantidad === 0) {
            setErrorModal('La cantidad debe ser un número entero diferente de cero.');
            return;
        }

        // Validación: stock resultante no puede ser negativo si se resta stock
        const stockResultante = productoSeleccionado.stock_actual + cantidad;
        if (stockResultante < 0) {
            setErrorModal(`Stock insuficiente. El stock resultante (${stockResultante}) no puede ser menor a 0.`);
            return;
        }

        // Validación: no permitir duplicados
        const existe = detalles.some(item => item.codigo === productoSeleccionado.codigo);
        if (existe) {
            setErrorModal('El producto ya está en el detalle. Si desea cambiar la cantidad, elimínelo e insértelo nuevamente.');
            return;
        }

        const subtotal = Math.round((cantidad * parseFloat(productoSeleccionado.pvp)) * 100) / 100;

        const nuevoItem = {
            codigo: productoSeleccionado.codigo,
            nombre: productoSeleccionado.nombre,
            stock_actual: productoSeleccionado.stock_actual,
            pvp: parseFloat(productoSeleccionado.pvp),
            graba_iva: productoSeleccionado.graba_iva,
            porcentaje_iva_aplicado: productoSeleccionado.porcentaje_iva_aplicado || 0,
            cantidad: cantidad,
            stock_resultante: stockResultante,
            subtotal: subtotal
        };

        setDetalles([...detalles, nuevoItem]);
        setShowModal(false);
        setMensaje({ texto: '', tipo: '' }); // Limpiar posibles alertas
    };

    const handleEliminarDetalle = (codigo) => {
        const nuevosDetalles = detalles.filter(item => item.codigo !== codigo);
        setDetalles(nuevosDetalles);
    };

    const handleGuardar = async () => {
        // Validaciones generales
        const errores = {};
        if (!descripcion.trim()) {
            errores.descripcion = 'La descripción es obligatoria.';
        }
        if (detalles.length === 0) {
            errores.detalles = 'Debe registrar al menos un producto en el detalle.';
        }

        if (Object.keys(errores).length > 0) {
            setErroresForm(errores);
            setMensaje({ texto: 'Por favor, corrija los errores del formulario.', tipo: 'error' });
            return;
        }

        setErroresForm({});
        setLoading(true);

        try {
            // 1. Guardar la cabecera
            const cabeceraCreada = await crearAjusteCabecera({
                descripcion: descripcion.trim(),
                fecha: new Date(fecha).toISOString(),
                impreso: false
            });

            const nroAjusteReal = cabeceraCreada.numero_ajuste;

            // 2. Guardar los detalles secuencialmente para evitar bloqueos
            for (const item of detalles) {
                await crearAjusteDetalle({
                    numero_ajuste: nroAjusteReal,
                    codigo_producto: item.codigo,
                    cantidad: item.cantidad
                });
            }

            setMensaje({
                texto: `Ajuste ${nroAjusteReal} registrado exitosamente. Se actualizó el stock de los productos.`,
                tipo: 'exito'
            });

            // Limpiar formulario
            setDescripcion('');
            setDetalles([]);
            
            // Recargar para actualizar el número de ajuste esperado
            inicializarPagina();

        } catch (error) {
            const msgError = error.response?.data?.mensaje || error.response?.data?.error || error.message;
            setMensaje({
                texto: `Error al registrar el ajuste: ${msgError}`,
                tipo: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelar = () => {
        // Redirige al inicio o limpia
        navigate('/');
    };

    // Filtrar catálogo en base a la búsqueda
    const productosFiltrados = productosCatalogo.filter(p => 
        p.codigo.toLowerCase().includes(filtroBusqueda.toLowerCase()) || 
        p.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase())
    );

    // Totales rápidos
    const totalCantidadItems = detalles.reduce((sum, item) => sum + Math.abs(item.cantidad), 0);
    const totalSubtotal = detalles.reduce((sum, item) => sum + item.subtotal, 0);

    return (
        <div className="ajuste-page-container">
            <header className="page-header">
                <h2>Ajuste de Productos</h2>
            </header>

            {mensaje.texto && (
                <div className={`mensaje-alerta ${mensaje.tipo === 'error' ? 'mensaje-alerta-error' : 'mensaje-alerta-exito'}`}>
                    {mensaje.texto}
                </div>
            )}

            {/* CABECERA FORM */}
            <div className="ajuste-card">
                <h3>Cabecera de Ajuste</h3>
                <div className="form-grid-3">
                    <div className="form-group">
                        <label>Número de Ajuste</label>
                        <input 
                            type="text" 
                            value={numeroAjuste} 
                            readOnly 
                            className="readonly-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>Fecha</label>
                        <input 
                            type="date" 
                            value={fecha} 
                            onChange={(e) => setFecha(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Descripción *</label>
                        <input 
                            type="text" 
                            placeholder="Ingrese el motivo de ajuste..." 
                            value={descripcion} 
                            onChange={(e) => setDescripcion(e.target.value)}
                            className={erroresForm.descripcion ? 'input-error' : ''}
                        />
                        {erroresForm.descripcion && <span className="error-text">{erroresForm.descripcion}</span>}
                    </div>
                </div>
            </div>

            {/* DETALLES TABLE */}
            <div className="ajuste-card">
                <div className="details-header">
                    <h3>Detalle de Ajuste</h3>
                    <button className="btn btn-primary" onClick={handleOpenModal}>
                        + Agregar Producto
                    </button>
                </div>

                {erroresForm.detalles && (
                    <div className="mensaje-alerta mensaje-alerta-error" style={{ padding: '8px 12px', fontSize: '13px' }}>
                        {erroresForm.detalles}
                    </div>
                )}

                <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Producto</th>
                                <th>Stock Actual</th>
                                <th>PVP</th>
                                <th>IVA</th>
                                <th>Cantidad</th>
                                <th>Stock Resultante</th>
                                <th>Subtotal</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detalles.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No se han agregado productos al ajuste. Presione "Agregar Producto" para iniciar.
                                    </td>
                                </tr>
                            ) : (
                                detalles.map((item, index) => (
                                    <tr key={`${item.codigo}-${index}`}>
                                        <td>{item.codigo}</td>
                                        <td>{item.nombre}</td>
                                        <td>{item.stock_actual}</td>
                                        <td>${item.pvp.toFixed(2)}</td>
                                        <td>
                                            <span className={`badge ${item.graba_iva ? 'badge-active' : 'badge-inactive'}`}>
                                                {item.graba_iva ? `${item.porcentaje_iva_aplicado}%` : '0%'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 'bold', color: item.cantidad < 0 ? 'var(--error-color)' : 'var(--primary-hover)' }}>
                                            {item.cantidad > 0 ? `+${item.cantidad}` : item.cantidad}
                                        </td>
                                        <td>{item.stock_resultante}</td>
                                        <td>${item.subtotal.toFixed(2)}</td>
                                        <td>
                                            <button 
                                                className="btn-danger-outline" 
                                                onClick={() => handleEliminarDetalle(item.codigo)}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {detalles.length > 0 && (
                    <div className="total-summary-bar">
                        <div className="summary-item">
                            Cantidad Ajustada: <strong>{totalCantidadItems} u.</strong>
                        </div>
                        <div className="summary-item">
                            Total Subtotal: <strong>${totalSubtotal.toFixed(2)}</strong>
                        </div>
                    </div>
                )}
            </div>

            {/* ACCIONES FORMULARIO MAESTRO */}
            <div className="page-actions">
                <button className="btn btn-secondary" onClick={handleCancelar} disabled={loading}>
                    Cancelar
                </button>
                <button className="btn btn-primary" onClick={handleGuardar} disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Ajuste'}
                </button>
            </div>

            {/* MODAL AGREGAR PRODUCTO */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content card" style={{ maxWidth: '500px' }}>
                        <h3 style={{ color: 'var(--primary-hover)', marginTop: 0 }}>Agregar Producto al Detalle</h3>
                        
                        {errorModal && (
                            <div className="mensaje-alerta mensaje-alerta-error" style={{ padding: '8px 12px', fontSize: '13px', marginBottom: '15px' }}>
                                {errorModal}
                            </div>
                        )}

                        {/* Buscador */}
                        <div className="form-group modal-product-search">
                            <label>Buscar Producto</label>
                            <input 
                                type="text" 
                                placeholder="Escriba código o nombre del producto..." 
                                value={filtroBusqueda} 
                                onChange={(e) => setFiltroBusqueda(e.target.value)}
                            />
                        </div>

                        {/* Listar productos */}
                        <label className="form-group" style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                            Seleccione un Producto *
                        </label>
                        <div className="product-list-container">
                            {productosFiltrados.length === 0 ? (
                                <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No se encontraron productos activos.
                                </div>
                            ) : (
                                productosFiltrados.map((prod) => (
                                    <div 
                                        key={prod.codigo} 
                                        className={`product-list-item ${productoSeleccionado?.codigo === prod.codigo ? 'selected' : ''}`}
                                        onClick={() => handleSeleccionarProducto(prod)}
                                    >
                                        <span className="product-list-item-code">{prod.codigo}</span>
                                        <span className="product-list-item-name">{prod.nombre}</span>
                                        <span className="product-list-item-stock">Stock: {prod.stock_actual}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Mostrar Info del Producto Seleccionado */}
                        {productoSeleccionado && (
                            <div className="selected-product-info">
                                <strong style={{ color: 'var(--secondary-color)' }}>Datos de Referencia:</strong>
                                <div className="info-grid-2">
                                    <div>
                                        <span className="info-label">Código:</span> <span className="info-value">{productoSeleccionado.codigo}</span>
                                    </div>
                                    <div>
                                        <span className="info-label">Nombre:</span> <span className="info-value">{productoSeleccionado.nombre}</span>
                                    </div>
                                    <div>
                                        <span className="info-label">Stock Actual:</span> <span className="info-value">{productoSeleccionado.stock_actual}</span>
                                    </div>
                                    <div>
                                        <span className="info-label">PVP:</span> <span className="info-value">${parseFloat(productoSeleccionado.pvp).toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="info-label">Graba IVA:</span> <span className="info-value">{productoSeleccionado.graba_iva ? 'Sí' : 'No'}</span>
                                    </div>
                                    <div>
                                        <span className="info-label">IVA Aplicado:</span> <span className="info-value">{productoSeleccionado.graba_iva ? `${productoSeleccionado.porcentaje_iva_aplicado || 0}%` : '0%'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Campo cantidad */}
                        <div className="form-group">
                            <label>Cantidad a Ajustar *</label>
                            <input 
                                type="number" 
                                placeholder="Ej: 5 para ingreso, -3 para egreso" 
                                value={cantidadModal} 
                                onChange={(e) => setCantidadModal(e.target.value)}
                                disabled={!productoSeleccionado}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                                Use valores positivos para incrementar stock y negativos para decrementarlo.
                            </span>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={handleCloseModal}>
                                Cancelar
                            </button>
                            <button className="btn btn-primary" onClick={handleAgregarDetalle} disabled={!productoSeleccionado}>
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AjusteProductosPage;
