import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, onClose, confirmText = 'Aceptar', cancelText = 'Cancelar' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content card" style={{ maxWidth: '420px', padding: 0, overflow: 'hidden', background: '#fff', borderRadius: '12px' }}>
                <div className="modal-header" style={{ padding: '16px 20px', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', justifyContent: 'space-between' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '16px', color: '#1a1a1a' }}>
                        <AlertTriangle size={20} style={{ color: 'var(--error-color)' }} /> 
                        {title}
                    </h3>
                    <button className="modal-close" onClick={onClose || onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body" style={{ padding: '24px 20px', fontSize: '14px', color: '#444', lineHeight: '1.5' }}>
                    {message}
                </div>
                <div className="modal-actions" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
                    <button className="btn btn-secondary" onClick={onCancel} style={{ padding: '8px 16px', fontWeight: '600' }}>
                        {cancelText}
                    </button>
                    <button className="btn btn-primary" onClick={onConfirm} style={{ padding: '8px 16px', fontWeight: '600', background: 'var(--error-color)', borderColor: 'var(--error-color)' }}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
