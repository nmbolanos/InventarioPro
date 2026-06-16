import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductos, desactivarProducto } from '../services/productoService';
import ProductoList from '../components/ProductoList';
import './ProductosPage.css';

const ProductosPage = () => {
    const navigate = useNavigate();
    const [productos, setProductos] = useState([]);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' }); // tipo: 'exito' | 'error'
    const [productoADesactivar, setProductoADesactivar] = useState(null); // Estado para el modal

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

    return (
        <div className="productos-page-container">
            <header className="page-header">
                <h2>Administración de Productos</h2>
                <button className="btn btn-primary" onClick={handleCrearNuevo}>
                    + Nuevo Producto
                </button>
            </header>

            {mensaje.texto && (
                <div className={`mensaje-alerta ${mensaje.tipo === 'error' ? 'mensaje-alerta-error' : 'mensaje-alerta-exito'}`}>
                    {mensaje.texto}
                </div>
            )}

            <div className="page-content">
                <ProductoList 
                    productos={productos} 
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
