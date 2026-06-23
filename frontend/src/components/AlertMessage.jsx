/**
 * AlertMessage - Componente reutilizable de alertas para todo el sistema.
 * 
 * Props:
 *   - texto (string): Mensaje a mostrar. Si está vacío, no renderiza nada.
 *   - tipo (string): 'exito' | 'error' | 'warning'. Determina el estilo visual.
 *   - onClose (function, opcional): Callback al cerrar la alerta. Si se provee, muestra botón ✕.
 */
const AlertMessage = ({ texto, tipo = 'error', onClose }) => {
    if (!texto) return null;

    const claseTipo = tipo === 'exito'
        ? 'mensaje-alerta-exito'
        : tipo === 'warning'
            ? 'mensaje-alerta-warning'
            : 'mensaje-alerta-error';

    return (
        <div className={`mensaje-alerta ${claseTipo}`}>
            <span>{texto}</span>
            {onClose && (
                <button className="alerta-close" onClick={onClose} title="Cerrar alerta">
                    ✕
                </button>
            )}
        </div>
    );
};

export default AlertMessage;
