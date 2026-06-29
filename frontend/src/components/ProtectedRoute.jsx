import React from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles = [], allowedPermissions = [] }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);
  const userRoles = user.roles || [];
  const userPermissions = user.permissions || [];

  // Verificar si tiene al menos uno de los roles permitidos (case-insensitive & trimmed)
  if (allowedRoles.length > 0) {
    const hasRole = allowedRoles.some((role) =>
      userRoles.map((r) => r.toLowerCase().trim()).includes(role.toLowerCase().trim())
    );
    if (!hasRole) {
      return <AccessDeniedView />;
    }
  }

  // Verificar si tiene al menos uno de los permisos permitidos (case-insensitive & trimmed)
  if (allowedPermissions.length > 0) {
    const hasPermission = allowedPermissions.some((perm) =>
      userPermissions.map((p) => p.toLowerCase().trim()).includes(perm.toLowerCase().trim())
    );
    if (!hasPermission) {
      return <AccessDeniedView />;
    }
  }

  return <Outlet />;
};

const AccessDeniedView = () => {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        textAlign: 'center',
        minHeight: '60vh',
        fontFamily: 'var(--font-family, "Inter", sans-serif)'
      }}
    >
      <div style={{ fontSize: '72px', marginBottom: '24px', animation: 'floatDenied 3s ease-in-out infinite' }}>🔒</div>
      <h2 style={{ color: 'var(--error-color, #E76F00)', margin: '0 0 12px 0', fontSize: '30px', fontWeight: '700' }}>
        Acceso Denegado
      </h2>
      <p style={{ color: 'var(--text-secondary, #8D99AE)', margin: '0 0 28px 0', maxWidth: '440px', fontSize: '15px', lineHeight: '1.6' }}>
        Su usuario no cuenta con los permisos o el rol necesario para ingresar a esta sección.
      </p>
      <button
        onClick={handleGoToLogin}
        style={{
          backgroundColor: 'var(--primary-color, #00B4D8)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '14px',
          transition: 'all 0.3s ease',
          boxShadow: 'var(--shadow-md, 0 4px 6px rgba(0,180,216,0.1))'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = 'var(--primary-hover, #0096C7)';
          e.target.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'var(--primary-color, #00B4D8)';
          e.target.style.transform = 'none';
        }}
      >
        Volver al Login
      </button>
      <style>{`
        @keyframes floatDenied {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

export default ProtectedRoute;
