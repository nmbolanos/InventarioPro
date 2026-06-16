import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProducto, createProducto, updateProducto } from '../services/productoService';
import ProductoForm from '../components/ProductoForm';
import './ProductosPage.css'; // Reutilizamos los estilos del contenedor

const ProductoFormPage = () => {
    const navigate = useNavigate();
    const { codigo } = useParams(); // Si hay un código en la URL, estamos editando
    
    const [producto, setProducto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mensajeError, setMensajeError] = useState('');

    async function cargarProducto(codigoProducto) {
        setLoading(true);
        try {
            const data = await getProducto(codigoProducto);
            setProducto(data);
        } catch (err) {
            console.error(err);
            setMensajeError('No se pudo cargar la información del producto.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (codigo) {
            const t = setTimeout(() => cargarProducto(codigo), 0);
            return () => clearTimeout(t);
        }
    }, [codigo]);

    const handleGuardar = async (productoData) => {
        try {
            if (codigo) {
                // Actualizar
                await updateProducto(codigo, productoData);
            } else {
                // Crear
                await createProducto(productoData);
            }
            // Volver a la lista de productos
            navigate('/productos');
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Error al guardar el producto';
            setMensajeError(errorMsg);
            throw error; // Para que el formulario interno detenga su 'isSubmitting'
        }
    };

    const handleCancelar = () => {
        navigate('/productos');
    };

    if (loading) {
        return <div className="productos-page-container">Cargando datos del producto...</div>;
    }

    return (
        <div className="productos-page-container">
            <header className="page-header" style={{ marginBottom: '20px', borderBottom: 'none' }}>
                <button className="btn btn-secondary" onClick={handleCancelar} style={{ marginBottom: '15px' }}>
                    &larr; Volver a la lista
                </button>
            </header>

            {mensajeError && (
                <div className="mensaje-alerta mensaje-alerta-error">
                    {mensajeError}
                </div>
            )}

            <div className="page-content">
                <ProductoForm 
                    producto={producto} 
                    onSave={handleGuardar} 
                    onCancel={handleCancelar} 
                />
            </div>
        </div>
    );
};

export default ProductoFormPage;
