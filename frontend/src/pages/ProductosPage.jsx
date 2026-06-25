import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductos, desactivarProducto } from '../services/productoService';
import { getCatalogoProveedores } from '../services/comprasService';
import ProductoList from '../components/ProductoList';
import AlertMessage from '../components/AlertMessage';
import './ProductosPage.css';

const ProductosPage = () => {
    const navigate = useNavigate();
    const [productos, setProductos] = useState([]);
    const [proveedoresCatalogo, setProveedoresCatalogo] = useState([]);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' }); // tipo: 'exito' | 'error'
    const [productoADesactivar, setProductoADesactivar] = useState(null); // Estado para el modal
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos'); // 'Todos', 'Activo', 'Inactivo'

    // Pagination State
    const [paginaActual, setPaginaActual] = useState(1);
    const [itemsPorPagina, setItemsPorPagina] = useState(10);

    // Sort State
    const [sortBy, setSortBy] = useState('codigo');
    const [sortOrder, setSortOrder] = useState('ASC');

    const mostrarMensaje = (texto, tipo) => {
        setMensaje({ texto, tipo });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000);
    };

    const cargarData = useCallback(async () => {
        try {
            const [prodsData, provsData] = await Promise.all([
                getProductos(),
                getCatalogoProveedores()
            ]);
            setProductos(prodsData);
            setProveedoresCatalogo(provsData);
        } catch (err) {
            console.error(err);
            mostrarMensaje('Error al cargar datos del servidor', 'error');
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => cargarData(), 0);
        return () => clearTimeout(t);
    }, [cargarData]);

    const handleCrearNuevo = () => {
        navigate('/productos/nuevo');
    };

    const handleEditar = (producto) => {
        navigate(`/productos/editar/${producto.codigo}`);
    };

    // Al hacer clic en el botón de la lista, solo abrimos el modal
    const handleSolicitarDesactivacion = (codigo) => {
        setProductoADesactivar(codigo);
    };

    // Esta función se ejecuta al confirmar en el modal
    const confirmarDesactivacion = async () => {
        if (!productoADesactivar) return;
        
        try {
            await desactivarProducto(productoADesactivar);
            mostrarMensaje('Producto desactivado exitosamente', 'exito');
            cargarData();
        } catch (error) {
            console.error(error);
            mostrarMensaje('Error al desactivar el producto', 'error');
        } finally {
            setProductoADesactivar(null); // Cerrar modal
        }
    };

    const cancelarDesactivacion = () => {
        setProductoADesactivar(null);
    };

    const productosFiltrados = productos.filter(prod => {
        const matchesSearch = prod.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              prod.codigo.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (filterStatus === 'Todos') return matchesSearch;
        return matchesSearch && prod.estado === filterStatus;
    });

    const productosOrdenados = [...productosFiltrados].sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === 'stock_actual' || sortBy === 'costo' || sortBy === 'pvp') {
            valA = parseFloat(valA || 0);
            valB = parseFloat(valB || 0);
        } else {
            valA = String(valA || '').toLowerCase();
            valB = String(valB || '').toLowerCase();
        }

        if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
        if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
        return 0;
    });

    // Pagination calculation
    const totalItems = productosOrdenados.length;
    const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1;
    const paginaSegura = Math.min(paginaActual, totalPaginas) || 1;
    const indiceInicio = (paginaSegura - 1) * itemsPorPagina;
    const productosPaginados = productosOrdenados.slice(indiceInicio, indiceInicio + itemsPorPagina);
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortBy(column);
            setSortOrder('ASC');
        }
        setPaginaActual(1);
    };

    return (
        <div className="productos-page-container">
            <header className="page-header">
                <h2>Administración de Productos</h2>
                <button className="btn btn-primary" onClick={handleCrearNuevo}>
                    + Nuevo Producto
                </button>
            </header>

            <AlertMessage 
                texto={mensaje.texto} 
                tipo={mensaje.tipo} 
                onClose={() => setMensaje({ texto: '', tipo: '' })} 
            />

            <div className="page-content">
                <div className="filtros-container card">
                    <div className="search-box">
                        <input 
                            type="text" 
                            placeholder="Buscar por código o nombre..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-tabs">
                        <button 
                            className={`filter-tab ${filterStatus === 'Todos' ? 'active' : ''}`}
                            onClick={() => { setFilterStatus('Todos'); setPaginaActual(1); }}
                        >
                            Todos
                        </button>
                        <button 
                            className={`filter-tab ${filterStatus === 'Activo' ? 'active' : ''}`}
                            onClick={() => { setFilterStatus('Activo'); setPaginaActual(1); }}
                        >
                            Activos
                        </button>
                        <button 
                            className={`filter-tab ${filterStatus === 'Inactivo' ? 'active' : ''}`}
                            onClick={() => { setFilterStatus('Inactivo'); setPaginaActual(1); }}
                        >
                            Inactivos
                        </button>
                    </div>
                </div>

                <ProductoList 
                    productos={productosPaginados} 
                    proveedoresCatalogo={proveedoresCatalogo}
                    onEdit={handleEditar} 
                    onDesactivar={handleSolicitarDesactivacion}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                />

                {totalItems > 0 && (
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
                            Mostrando {indiceInicio + 1} a {Math.min(indiceInicio + itemsPorPagina, totalItems)} de {totalItems} registros
                        </span>
                    </div>
                )}
            </div>

            {/* Modal Personalizado de Confirmación */}
            {productoADesactivar && (
                <div className="modal-overlay">
                    <div className="modal-content card">
                        <h3 style={{ color: 'var(--secondary-color)', marginTop: 0 }}>Confirmar Desactivación</h3>
                        <p style={{ color: 'var(--text-primary)', marginBottom: '25px' }}>
                            ¿Estás seguro que deseas desactivar el producto con código <strong>{productoADesactivar}</strong>? 
                            <br/><br/>
                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                El producto pasará a estado Inactivo y ya no aparecerá en el catálogo para Facturación.
                            </span>
                        </p>
                        <div className="form-actions" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                            <button className="btn btn-secondary" onClick={cancelarDesactivacion}>
                                Cancelar
                            </button>
                            <button className="btn" style={{ backgroundColor: 'var(--cancel-color)', color: 'white' }} onClick={confirmarDesactivacion}>
                                Sí, desactivar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductosPage;
