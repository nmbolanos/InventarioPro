import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getAjustesCabecera,
    getAjusteCabeceraPorId,
    crearAjusteCabecera,
    actualizarAjusteCabecera,
    crearAjusteDetalle,
    eliminarAjusteDetalle,
    getProductosCatalogo,
    imprimirAjuste
} from '../services/ajusteService';
import AlertMessage from '../components/AlertMessage';
import './AjusteProductosPage.css';

const AjusteProductosPage = () => {
    const navigate = useNavigate();

    // History State
    const [historialAjustes, setHistorialAjustes] = useState([]);
    const [activeTab, setActiveTab] = useState('nuevo'); // 'nuevo' | 'historial'

    // Pagination State
    const [paginaActual, setPaginaActual] = useState(1);
    const [itemsPorPagina, setItemsPorPagina] = useState(10);

    // Filter States
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('Todos'); // 'Todos' | 'Borradores' | 'Impresos'

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
    const [documentoGuardado, setDocumentoGuardado] = useState(null);
    const [showDetallesModal, setShowDetallesModal] = useState(false);
    const [ajusteDetallesView, setAjusteDetallesView] = useState(null);

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

    const cargarAjusteEnFormularioLocally = (cabeceraCompleta) => {
        setNumeroAjuste(cabeceraCompleta.numero_ajuste);
        setFecha(new Date(cabeceraCompleta.fecha).toISOString().substring(0, 10));
        setDescripcion(cabeceraCompleta.descripcion || '');
        setDetalles((cabeceraCompleta.detalles || []).map((item) => {
            const pvpParsed = parseFloat(item.pvp || 0);
            const cantidadParsed = parseInt(item.cantidad || 0, 10);
            const subtotalParsed = item.subtotal !== undefined ? parseFloat(item.subtotal) : (Math.abs(cantidadParsed) * pvpParsed);
            return {
                id_detalle: item.id_detalle,
                codigo: item.codigo_producto,
                nombre: item.producto_nombre || item.codigo_producto,
                stock_actual: parseInt(item.stock_actual || 0, 10),
                pvp: pvpParsed,
                graba_iva: Boolean(item.graba_iva),
                porcentaje_iva_aplicado: parseFloat(item.porcentaje_iva_aplicado || 0),
                cantidad: cantidadParsed,
                stock_resultante: parseInt(item.stock_resultante ?? (item.stock_actual ?? 0), 10) + cantidadParsed,
                subtotal: subtotalParsed
            };
        }));
        setDocumentoGuardado(cabeceraCompleta);
        setErroresForm({});
    };

    const cargarHistorial = async () => {
        try {
            const cabeceras = await getAjustesCabecera();
            // Ordenar cabeceras por número de ajuste DESC (del más reciente al más antiguo)
            const sorted = [...cabeceras].sort((a, b) => b.numero_ajuste.localeCompare(a.numero_ajuste));
            setHistorialAjustes(sorted);
            return cabeceras;
        } catch (err) {
            console.error('Error al cargar historial', err);
            return [];
        }
    };

    const inicializarPagina = useCallback(async () => {
        setLoading(true);
        try {
            const cabecerasHistorial = await cargarHistorial();

            const proximoNumero = calcularSiguienteNumero(cabecerasHistorial);
            setNumeroAjuste(proximoNumero);
            setFecha(new Date().toISOString().substring(0, 10));
            setDescripcion('');
            setDetalles([]);
            setDocumentoGuardado(null);
            setErroresForm({});

            try {
                const catalogo = await getProductosCatalogo();
                setProductosCatalogo(catalogo);
            } catch (err) {
                console.error(err);
            }
        } catch (err) {
            console.error(err);
            setMensaje({
                texto: 'Error al conectar con el servidor. Verifique si el backend está en ejecución.',
                tipo: 'error'
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => inicializarPagina(), 0);
        return () => clearTimeout(t);
    }, [inicializarPagina]);

    const handleNuevoFormulario = async () => {
        setLoading(true);
        setMensaje({ texto: '', tipo: '' });
        try {
            const cabeceras = await cargarHistorial();
            const proximoNumero = calcularSiguienteNumero(cabeceras);
            setNumeroAjuste(proximoNumero);
            setFecha(new Date().toISOString().substring(0, 10));
            setDescripcion('');
            setDetalles([]);
            setDocumentoGuardado(null);
            setErroresForm({});
            setActiveTab('nuevo'); // Switch to formulario tab
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditarAjuste = async (numeroAj) => {
        setLoading(true);
        setMensaje({ texto: '', tipo: '' });
        try {
            const cabeceraCompleta = await getAjusteCabeceraPorId(numeroAj);
            cargarAjusteEnFormularioLocally(cabeceraCompleta);
            setActiveTab('nuevo'); // Switch to formulario tab
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error(err);
            setMensaje({ texto: 'Error al cargar el ajuste para edición.', tipo: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleImprimirDesdeLista = async (numeroAj) => {
        setLoading(true);
        setMensaje({ texto: '', tipo: '' });
        try {
            const response = await imprimirAjuste(numeroAj);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener,noreferrer');
            setMensaje({ texto: `Documento ${numeroAj} impreso y bloqueado correctamente.`, tipo: 'exito' });
            setTimeout(() => window.URL.revokeObjectURL(url), 10000);

            await cargarHistorial(); // Refrescar lista

            // Si el ajuste que se acaba de imprimir es el que está abierto en el formulario, 
            // lo actualizamos para que se bloquee también en la vista superior.
            if (documentoGuardado && documentoGuardado.numero_ajuste === numeroAj) {
                setDocumentoGuardado((actual) => ({ ...(actual || {}), impreso: true }));
            }
        } catch (error) {
            const msgError = error.response?.data?.mensaje || error.response?.data?.error || error.message;
            setMensaje({ texto: `Error al imprimir el documento: ${msgError}`, tipo: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerDetalles = async (numeroAj) => {
        setLoading(true);
        try {
            const cabeceraCompleta = await getAjusteCabeceraPorId(numeroAj);
            setAjusteDetallesView(cabeceraCompleta);
            setShowDetallesModal(true);
        } catch (err) {
            console.error(err);
            setMensaje({ texto: 'Error al cargar los detalles del ajuste.', tipo: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const documentoImpreso = Boolean(documentoGuardado?.impreso);
    const documentoBloqueado = documentoImpreso;

    const handleOpenModal = async () => {
        if (documentoBloqueado) return;
        setErrorModal('');
        setFiltroBusqueda('');
        setProductoSeleccionado(null);
        setCantidadModal('');

        try {
            const catalogo = await getProductosCatalogo();
            setProductosCatalogo(catalogo);
        } catch (err) {
            console.error('Error al actualizar catálogo de productos:', err);
        }

        setShowModal(true);
    };

    const handleCloseModal = () => setShowModal(false);

    const handleSeleccionarProducto = (prod) => {
        if (documentoBloqueado) return;
        setProductoSeleccionado(prod);
        setErrorModal('');
        setCantidadModal('');
    };

    const handleAgregarDetalle = () => {
        if (documentoBloqueado) {
            setErrorModal('El documento ya fue guardado. Imprímalo para bloquearlo definitivamente.');
            return;
        }

        if (!productoSeleccionado) {
            setErrorModal('Debe seleccionar un producto del catálogo.');
            return;
        }

        const cantidad = parseInt(cantidadModal, 10);
        if (isNaN(cantidad) || cantidad === 0) {
            setErrorModal('La cantidad debe ser un número entero diferente de cero.');
            return;
        }

        const stockResultante = productoSeleccionado.stock_actual + cantidad;
        if (stockResultante < 0) {
            setErrorModal(`Stock insuficiente. El stock resultante (${stockResultante}) no puede ser menor a 0.`);
            return;
        }

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
        setMensaje({ texto: '', tipo: '' });
    };

    const handleEliminarDetalle = async (codigo) => {
        if (documentoBloqueado) return;
        const itemToRemove = detalles.find(item => item.codigo === codigo);
        if (itemToRemove?.id_detalle) {
            if (!window.confirm('Este producto ya está guardado en el documento. ¿Desea eliminarlo permanentemente y revertir su stock?')) return;
            setLoading(true);
            try {
                await eliminarAjusteDetalle(itemToRemove.id_detalle);
                await cargarHistorial(); // Actualizar lista
            } catch (error) {
                const msgError = error.response?.data?.mensaje || error.message;
                setMensaje({ texto: `Error al eliminar el detalle: ${msgError}`, tipo: 'error' });
                setLoading(false);
                return;
            }
            setLoading(false);
        }
        const nuevosDetalles = detalles.filter(item => item.codigo !== codigo);
        setDetalles(nuevosDetalles);
    };

    const handleGuardar = async () => {
        const errores = {};
        if (!descripcion.trim()) errores.descripcion = 'La descripción es obligatoria.';
        if (detalles.length === 0) errores.detalles = 'Debe registrar al menos un producto en el detalle.';

        if (Object.keys(errores).length > 0) {
            setErroresForm(errores);
            setMensaje({ texto: 'Por favor, corrija los errores del formulario.', tipo: 'error' });
            return;
        }

        setErroresForm({});
        setLoading(true);

        const datosCabecera = {
            descripcion: descripcion.trim(),
            fecha: new Date(fecha).toISOString(),
            impreso: false
        };

        // Preparamos los datos de detalle para los logs (con numero_ajuste temporal/pendiente)
        const datosDetalleLog = detalles.map(item => ({
            codigo_producto: item.codigo,
            cantidad: item.cantidad
        }));

        console.log("=== DATOS DE CABECERA ENVIADOS ===", datosCabecera);
        console.log("=== DATOS DE DETALLE ENVIADOS ===", datosDetalleLog);

        try {
            if (documentoGuardado) {
                // Modo Edición: Actualizar cabecera
                await actualizarAjusteCabecera(documentoGuardado.numero_ajuste, datosCabecera);

                // Crear solo los detalles que no han sido guardados
                const detallesNuevos = detalles.filter(d => !d.id_detalle);
                for (const item of detallesNuevos) {
                    await crearAjusteDetalle({
                        numero_ajuste: documentoGuardado.numero_ajuste,
                        codigo_producto: item.codigo,
                        cantidad: item.cantidad
                    });
                }

                setMensaje({
                    texto: `Ajuste ${documentoGuardado.numero_ajuste} actualizado exitosamente.`,
                    tipo: 'exito'
                });

                // Limpiar campos
                const cabeceras = await cargarHistorial();
                const proximoNumero = calcularSiguienteNumero(cabeceras);
                setNumeroAjuste(proximoNumero);
                setFecha(new Date().toISOString().substring(0, 10));
                setDescripcion('');
                setDetalles([]);
                setDocumentoGuardado(null);
                setErroresForm({});
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // Modo Creación
                const cabeceraCreada = await crearAjusteCabecera(datosCabecera);

                const nroAjusteReal = cabeceraCreada.numero_ajuste;
                const detallesConId = [];

                for (const item of detalles) {
                    const res = await crearAjusteDetalle({
                        numero_ajuste: nroAjusteReal,
                        codigo_producto: item.codigo,
                        cantidad: item.cantidad
                    });
                    detallesConId.push({
                        ...item,
                        id_detalle: res.id_detalle
                    });
                }

                setMensaje({
                    texto: `Ajuste ${nroAjusteReal} registrado exitosamente. Puede imprimirlo desde la pestaña Historial.`,
                    tipo: 'exito'
                });

                // Limpiar campos y preparar el siguiente número
                const cabeceras = await cargarHistorial();
                const proximoNumero = calcularSiguienteNumero(cabeceras);
                setNumeroAjuste(proximoNumero);
                setFecha(new Date().toISOString().substring(0, 10));
                setDescripcion('');
                setDetalles([]);
                setDocumentoGuardado(null);
                setErroresForm({});
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            console.error("=== ERROR EN EL BACKEND ===", error);
            const responseData = error.response?.data;
            let msgError = error.message;
            if (responseData) {
                if (responseData.mensaje && responseData.error) {
                    msgError = `${responseData.mensaje}: ${responseData.error}`;
                } else {
                    msgError = responseData.mensaje || responseData.error || error.message;
                }
            }
            setMensaje({
                texto: `Error al registrar el ajuste: ${msgError}`,
                tipo: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleImprimir = async () => {
        if (!documentoGuardado?.numero_ajuste) {
            setMensaje({ texto: 'Primero debe guardar el documento antes de imprimir.', tipo: 'error' });
            return;
        }

        setLoading(true);
        try {
            const response = await imprimirAjuste(documentoGuardado.numero_ajuste);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener,noreferrer');
            setDocumentoGuardado((actual) => ({ ...(actual || {}), impreso: true }));
            setMensaje({ texto: `Documento ${documentoGuardado.numero_ajuste} impreso y bloqueado correctamente.`, tipo: 'exito' });
            setTimeout(() => window.URL.revokeObjectURL(url), 10000);

            await cargarHistorial(); // Refrescar lista para que aparezca como impreso
        } catch (error) {
            const msgError = error.response?.data?.mensaje || error.response?.data?.error || error.message;
            setMensaje({ texto: `Error al imprimir el documento: ${msgError}`, tipo: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelar = () => {
        navigate('/');
    };

    const productosFiltrados = filtroBusqueda.trim() === '' ? [] : productosCatalogo.filter(p =>
        p.codigo.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
        p.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase())
    );

    // Filter history list by date range and status
    const historialFiltrado = historialAjustes.filter(item => {
        if (fechaDesde || fechaHasta) {
            if (!item.fecha) return false;
            const fechaItem = new Date(item.fecha).toISOString().substring(0, 10);
            if (fechaDesde && fechaItem < fechaDesde) return false;
            if (fechaHasta && fechaItem > fechaHasta) return false;
        }

        if (filtroEstado === 'Borradores' && item.impreso) return false;
        if (filtroEstado === 'Impresos' && !item.impreso) return false;

        return true;
    });

    // Pagination calculation
    const totalItems = historialFiltrado.length;
    const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1;
    const paginaSegura = Math.min(paginaActual, totalPaginas);
    const indiceInicio = (paginaSegura - 1) * itemsPorPagina;
    const historialPaginado = historialFiltrado.slice(indiceInicio, indiceInicio + itemsPorPagina);

    const totalCantidadItems = detalles.reduce((sum, item) => sum + Math.abs(item.cantidad), 0);
    const totalSubtotal = detalles.reduce((sum, item) => sum + item.subtotal, 0);

    return (
        <div className="ajuste-page-container">
            {/* =========================================
                SECCIÓN SUPERIOR: TÍTULO Y CABECERA GLOBAL
            ========================================= */}
            <header className="page-header">
                <div>
                    <h2>Ajustes de Inventario</h2>
                    <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>
                        {activeTab === 'nuevo'
                            ? (documentoImpreso ? 'Documento impreso y bloqueado' : documentoBloqueado ? 'Documento guardado, listo para imprimir' : 'Documento en edición')
                            : 'Historial completo de ajustes'}
                    </p>
                </div>
                {activeTab === 'nuevo' && (
                    <div className="header-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    </div>
                )}
            </header>

            {/* TABS CONTAINER */}
            <div className="tabs-container" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className={`tab-button ${activeTab === 'nuevo' ? 'active' : ''}`}
                        onClick={() => setActiveTab('nuevo')}
                    >
                        Nuevo / Editar Ajuste
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'historial' ? 'active' : ''}`}
                        onClick={() => setActiveTab('historial')}
                    >
                        Historial de Ajustes
                    </button>
                </div>
                {activeTab === 'nuevo' && (
                    <div style={{ display: 'flex', gap: '10px', paddingBottom: '8px' }}>
                        <button className="btn btn-secondary" onClick={handleNuevoFormulario} disabled={loading}>
                            Limpiar Formulario
                        </button>
                    </div>
                )}
            </div>

            {activeTab === 'nuevo' && documentoGuardado?.numero_ajuste && (
                <AlertMessage
                    texto={documentoImpreso
                        ? `El ajuste ${documentoGuardado.numero_ajuste} ya fue impreso; no se puede modificar.`
                        : `El ajuste ${documentoGuardado.numero_ajuste} fue guardado y queda pendiente de impresión.`}
                    tipo={documentoImpreso ? 'exito' : 'warning'}
                />
            )}

            <AlertMessage
                texto={mensaje.texto}
                tipo={mensaje.tipo}
                onClose={() => setMensaje({ texto: '', tipo: '' })}
            />

            {/* TAB: NUEVO AJUSTE */}
            {activeTab === 'nuevo' && (
                <>
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
                                    disabled={documentoBloqueado}
                                />
                            </div>
                            <div className="form-group">
                                <label>Fecha</label>
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    disabled={documentoBloqueado}
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
                                    disabled={documentoBloqueado}
                                />
                                {erroresForm.descripcion && <span className="error-text">{erroresForm.descripcion}</span>}
                            </div>
                        </div>
                    </div>

                    {/* DETALLES TABLE */}
                    <div className="ajuste-card">
                        <div className="details-header">
                            <h3>Detalle de Ajuste</h3>
                            <button className="btn btn-primary" onClick={handleOpenModal} disabled={documentoBloqueado}>
                                + Agregar Producto
                            </button>
                        </div>

                        {erroresForm.detalles && (
                            <div style={{ marginBottom: '15px' }}>
                                <AlertMessage texto={erroresForm.detalles} tipo="error" />
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
                                                        disabled={documentoBloqueado}
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
                                    Cantidad Ajustada: <strong>{totalCantidadItems} unidades</strong>
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
                        <button className="btn btn-primary" onClick={handleGuardar} disabled={loading || documentoBloqueado}>
                            {loading ? 'Guardando...' : 'Guardar Ajuste'}
                        </button>
                    </div>
                </>
            )}

            {/* TAB: HISTORIAL */}
            {activeTab === 'historial' && (
                <div className="ajuste-card historial-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Historial de Ajustes</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Consulte y edite los ajustes de inventario registrados
                        </p>
                    </div>

                    {/* FILTROS DE HISTORIAL */}
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px', width: '100%' }}>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '140px' }}>
                            <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Fecha Desde</label>
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => { setFechaDesde(e.target.value); setPaginaActual(1); }}
                                style={{ height: '38px', padding: '0 12px', width: '100%' }}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '140px' }}>
                            <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Fecha Hasta</label>
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => { setFechaHasta(e.target.value); setPaginaActual(1); }}
                                style={{ height: '38px', padding: '0 12px', width: '100%' }}
                            />
                        </div>
                        
                        <div className="filter-tabs" style={{ marginBottom: 0, display: 'flex', height: '38px', flex: 1.5, minWidth: '280px' }}>
                            <button 
                                className={`filter-tab ${filtroEstado === 'Todos' ? 'active' : ''}`}
                                onClick={() => { setFiltroEstado('Todos'); setPaginaActual(1); }}
                                style={{ height: '100%', margin: 0, flex: 1 }}
                            >
                                Todos
                            </button>
                            <button 
                                className={`filter-tab ${filtroEstado === 'Borradores' ? 'active' : ''}`}
                                onClick={() => { setFiltroEstado('Borradores'); setPaginaActual(1); }}
                                style={{ height: '100%', margin: 0, flex: 1 }}
                            >
                                Borradores
                            </button>
                            <button 
                                className={`filter-tab ${filtroEstado === 'Impresos' ? 'active' : ''}`}
                                onClick={() => { setFiltroEstado('Impresos'); setPaginaActual(1); }}
                                style={{ height: '100%', margin: 0, flex: 1 }}
                            >
                                Impresos
                            </button>
                        </div>

                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setFechaDesde('');
                                setFechaHasta('');
                                setFiltroEstado('Todos');
                                setPaginaActual(1);
                            }}
                            disabled={!fechaDesde && !fechaHasta && filtroEstado === 'Todos'}
                            style={{ height: '38px', padding: '0 20px', flex: '0 0 auto' }}
                        >
                            Limpiar Filtros
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto', marginTop: '15px' }}>
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Número</th>
                                    <th>Fecha</th>
                                    <th>Descripción</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historialPaginado.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                                            No se encontraron ajustes con los filtros seleccionados.
                                        </td>
                                    </tr>
                                ) : (
                                    historialPaginado.map((item) => (
                                        <tr key={item.numero_ajuste}>
                                            <td 
                                                style={{ fontWeight: 'bold', color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline' }}
                                                onClick={() => handleVerDetalles(item.numero_ajuste)}
                                                title="Ver Detalles"
                                            >
                                                {item.numero_ajuste}
                                            </td>
                                            <td>{new Date(item.fecha).toLocaleDateString('es-EC')}</td>
                                            <td>{item.descripcion}</td>
                                            <td>
                                                <span className={`badge ${item.impreso ? 'badge-active' : 'badge-inactive'}`} style={{ backgroundColor: item.impreso ? '#d4edda' : '#fff3cd', color: item.impreso ? '#155724' : '#856404' }}>
                                                    {item.impreso ? 'Impreso (Bloqueado)' : 'Borrador'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* CONTROLES DE PAGINACIÓN */}
                    {totalItems > 0 && (
                        <div className="pagination-container">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    Mostrar
                                </span>
                                <select
                                    value={itemsPorPagina}
                                    onChange={(e) => { setItemsPorPagina(Number(e.target.value)); setPaginaActual(1); }}
                                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    registros por página
                                </span>
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
                                Mostrando {indiceInicio + 1} a {Math.min(indiceInicio + itemsPorPagina, totalItems)} de {totalItems} registros
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL AGREGAR PRODUCTO */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content card" style={{ maxWidth: '520px' }}>
                        <h3 style={{ color: 'var(--primary-hover)', marginTop: 0 }}>Agregar Producto al Detalle</h3>

                        {errorModal && (
                            <div style={{ marginBottom: '15px' }}>
                                <AlertMessage texto={errorModal} tipo="error" />
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
                                disabled={documentoBloqueado}
                                autoFocus
                            />
                        </div>

                        {/* Listar productos */}
                        {filtroBusqueda.trim() !== '' && (
                            <>
                                <label className="form-group" style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                                    Seleccione un Producto *
                                </label>
                                <div className="product-list-container">
                                    {productosFiltrados.length === 0 ? (
                                        <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            No se encontraron productos coincidentes.
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
                            </>
                        )}

                        {/* Mostrar Info del Producto Seleccionado y Cantidad en línea */}
                        {productoSeleccionado && (
                            <>
                                <div className="modal-quantity-row">
                                    <span>
                                        <strong>{productoSeleccionado.nombre}</strong> <br />
                                        <small style={{ color: 'var(--text-secondary)' }}>Código: {productoSeleccionado.codigo}</small>
                                    </span>
                                    <div className="modal-quantity-input-wrapper">
                                        <label htmlFor="cantidad-modal-input">Cant:</label>
                                        <input
                                            id="cantidad-modal-input"
                                            type="number"
                                            placeholder="Cant."
                                            value={cantidadModal}
                                            onChange={(e) => setCantidadModal(e.target.value)}
                                            disabled={documentoBloqueado}
                                        />
                                    </div>
                                </div>

                                <div className="selected-product-info" style={{ marginTop: '10px' }}>
                                    <strong style={{ color: 'var(--secondary-color)' }}>Datos de Referencia:</strong>
                                    <div className="info-grid-2">
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
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '8px' }}>
                                        Use valores positivos para ingresar stock y negativos para egresarlo.
                                    </span>
                                </div>
                            </>
                        )}

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={handleCloseModal}>
                                Cancelar
                            </button>
                            <button className="btn btn-primary" onClick={handleAgregarDetalle} disabled={!productoSeleccionado || documentoBloqueado}>
                                Agregar al detalle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL VER DETALLES */}
            {showDetallesModal && ajusteDetallesView && (
                <div className="modal-overlay">
                    <div className="modal-content card" style={{ maxWidth: '700px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ color: 'var(--primary-hover)', margin: 0 }}>
                                Detalles del Ajuste: {ajusteDetallesView.numero_ajuste}
                            </h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {!ajusteDetallesView.impreso && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowDetallesModal(false);
                                            handleEditarAjuste(ajusteDetallesView.numero_ajuste);
                                        }}
                                        disabled={loading}
                                    >
                                        Editar
                                    </button>
                                )}
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleImprimirDesdeLista(ajusteDetallesView.numero_ajuste)}
                                    disabled={loading}
                                >
                                    {ajusteDetallesView.impreso ? 'Imprimir PDF' : 'Imprimir'}
                                </button>
                                <button className="btn btn-secondary" onClick={() => setShowDetallesModal(false)}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <strong>Fecha:</strong> {new Date(ajusteDetallesView.fecha).toLocaleDateString('es-EC')} <br />
                            <strong>Descripción:</strong> {ajusteDetallesView.descripcion} <br />
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(ajusteDetallesView.detalles || []).length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center' }}>No hay detalles registrados.</td>
                                        </tr>
                                    ) : (
                                        ajusteDetallesView.detalles.map((d, i) => {
                                            const pvp = parseFloat(d.pvp || 0);
                                            const subtotal = d.subtotal !== undefined ? parseFloat(d.subtotal) : (Math.abs(parseInt(d.cantidad || 0, 10)) * pvp);
                                            return (
                                                <tr key={i}>
                                                    <td>{d.codigo_producto}</td>
                                                    <td>{d.producto_nombre || d.codigo_producto}</td>
                                                    <td style={{ fontWeight: 'bold', color: d.cantidad < 0 ? 'var(--error-color)' : 'var(--primary-hover)' }}>
                                                        {d.cantidad > 0 ? `+${d.cantidad}` : d.cantidad}
                                                    </td>
                                                    <td>${subtotal.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AjusteProductosPage;
