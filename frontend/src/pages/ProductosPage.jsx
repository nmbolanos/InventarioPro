import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductos, desactivarProducto } from '../services/productoService';
import ProductoList from '../components/ProductoList';
import AlertMessage from '../components/AlertMessage';
import './ProductosPage.css';

const ProductosPage = () => {
    const navigate = useNavigate();
    const [productos, setProductos] = useState([]);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' }); // tipo: 'exito' | 'error'
    const [productoADesactivar, setProductoADesactivar] = useState(null); // Estado para el modal
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos'); // 'Todos', 'Activo', 'Inactivo'

    const mostrarMensaje = (texto, tipo) => {
        setMensaje({ texto, tipo });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000);
    };

    const cargarProductos = useCallback(async () => {
        try {
            const data = await getProductos();
            setProductos(data);
        } catch (err) {
            console.error(err);
            mostrarMensaje('Error al cargar productos del servidor', 'error');
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => cargarProductos(), 0);
        return () => clearTimeout(t);
    }, [cargarProductos]);

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
            cargarProductos();
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
                            onClick={() => setFilterStatus('Todos')}
                        >
                            Todos
                        </button>
                        <button 
                            className={`filter-tab ${filterStatus === 'Activo' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('Activo')}
                        >
                            Activos
                        </button>
                        <button 
                            className={`filter-tab ${filterStatus === 'Inactivo' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('Inactivo')}
                        >
                            Inactivos
                        </button>
                    </div>
                </div>

                <ProductoList 
                    productos={productosFiltrados} 
                    onEdit={handleEditar} 
                    onDesactivar={handleSolicitarDesactivacion} 
                />
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
