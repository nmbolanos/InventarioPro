import { useEffect, useState } from 'react';

/**
 * AlertMessage - Componente reutilizable de alertas para todo el sistema.
 * 
 * Props:
 *   - texto (string): Mensaje a mostrar. Si está vacío, no renderiza nada.
 *   - tipo (string): 'exito' | 'error' | 'warning'. Determina el estilo visual.
 *   - onClose (function, opcional): Callback al cerrar la alerta.
 */
const AlertMessage = ({ texto, tipo = 'error', onClose }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (!texto) return;
        setVisible(true);

        const timer = setTimeout(() => {
            setVisible(false);
            if (onClose) onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [texto, onClose]);

    if (!texto || !visible) return null;

    const claseTipo = tipo === 'exito'
        ? 'mensaje-alerta-exito'
        : tipo === 'warning'
            ? 'mensaje-alerta-warning'
            : 'mensaje-alerta-error';

    return (
        <div className={`mensaje-alerta toast-modal ${claseTipo}`}>
            <span>{texto}</span>
            <button className="alerta-close" onClick={() => {
                setVisible(false);
                if (onClose) onClose();
            }} title="Cerrar alerta">
                ✕
            </button>
        </div>
    );
};

export default AlertMessage;
