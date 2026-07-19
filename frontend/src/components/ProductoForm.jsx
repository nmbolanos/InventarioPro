import { useState, useEffect } from 'react';

const ProductoForm = ({ producto, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        graba_iva: true,
        costo: '',
        pvp: '',
        estado: 'Activo'
    });
    const [erroresLocales, setErroresLocales] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (producto) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                codigo: producto.codigo || '',
                nombre: producto.nombre || '',
                descripcion: producto.descripcion || '',
                graba_iva: producto.graba_iva,
                costo: producto.costo || '',
                pvp: producto.pvp || '',
                estado: producto.estado || 'Activo'
            });
        }
    }, [producto]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
        
        // Limpiar error local si el usuario empieza a escribir
        if (erroresLocales[name]) {
            setErroresLocales({
                ...erroresLocales,
                [name]: ''
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (producto && !formData.codigo.trim()) newErrors.codigo = 'El código es requerido.';
        if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido.';
        if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es requerida.';
        if (formData.costo === '' || formData.costo === null || isNaN(formData.costo) || Number(formData.costo) < 0) {
            newErrors.costo = 'Costo válido requerido.';
        }
        if (formData.pvp === '' || formData.pvp === null || isNaN(formData.pvp) || Number(formData.pvp) < 0) {
            newErrors.pvp = 'PVP válido requerido.';
        }

        setErroresLocales(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await onSave({
                ...formData,
                costo: Number(formData.costo),
                pvp: Number(formData.pvp)
            });
        } catch (err) {
            // Error manejado por el padre (backend error)
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card form-container">
            <h3>{producto ? 'Editar Producto' : 'Registrar Nuevo Producto'}</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Código del Producto</label>
                    <input 
                        type="text" 
                        name="codigo" 
                        value={formData.codigo} 
                        onChange={handleChange}
                        className={erroresLocales.codigo ? 'input-error' : ''}
                        disabled={true} // El código ahora siempre es de solo lectura (autogenerado al crear)
                        placeholder={producto ? "" : "Se generará automáticamente (PRD-XXXX)"}
                    />
                    {erroresLocales.codigo && <span className="error-text">{erroresLocales.codigo}</span>}
                </div>

                <div className="form-group">
                    <label>Nombre</label>
                    <input 
                        type="text" 
                        name="nombre" 
                        value={formData.nombre} 
                        onChange={handleChange}
                        className={erroresLocales.nombre ? 'input-error' : ''}
                    />
                    {erroresLocales.nombre && <span className="error-text">{erroresLocales.nombre}</span>}
                </div>

                <div className="form-group">
                    <label>Descripción <span style={{color: '#d10a11'}}>*</span></label>
                    <textarea 
                        name="descripcion" 
                        value={formData.descripcion} 
                        onChange={handleChange}
                        className={erroresLocales.descripcion ? 'input-error' : ''}
                        rows="3"
                    ></textarea>
                    {erroresLocales.descripcion && <span className="error-text">{erroresLocales.descripcion}</span>}
                </div>

                <div className="form-row">
                    <div className="form-group half-width">
                        <label>Costo</label>
                        <input 
                            type="number" 
                            step="0.01"
                            name="costo" 
                            value={formData.costo} 
                            onChange={handleChange}
                            className={erroresLocales.costo ? 'input-error' : ''}
                        />
                        {erroresLocales.costo && <span className="error-text">{erroresLocales.costo}</span>}
                    </div>

                    <div className="form-group half-width">
                        <label>P.V.P.</label>
                        <input 
                            type="number" 
                            step="0.01"
                            name="pvp" 
                            value={formData.pvp} 
                            onChange={handleChange}
                            className={erroresLocales.pvp ? 'input-error' : ''}
                        />
                        {erroresLocales.pvp && <span className="error-text">{erroresLocales.pvp}</span>}
                    </div>
                </div>

                <div className="form-row checkbox-row">
                    <label className="checkbox-label">
                        <input 
                            type="checkbox" 
                            name="graba_iva" 
                            checked={formData.graba_iva} 
                            onChange={handleChange}
                        />
                        Graba IVA
                    </label>

                    {producto && (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'inline-block', marginRight: '10px' }}>Estado:</label>
                            <select 
                                name="estado" 
                                value={formData.estado} 
                                onChange={handleChange}
                            >
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductoForm;
