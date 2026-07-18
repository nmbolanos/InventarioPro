import React, { useState } from 'react';
import { Package, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import LogoUTN from '../Logo_UTN.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('login'); // 'login', 'forgot', 'reset'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error al decodificar el token JWT:', e);
      return null;
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Por favor, ingrese su correo electrónico.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const response = await axios.post('/api/auth/forgot-password', { email: email.trim() });
      if (response.data.success) {
        setSuccessMsg(response.data.message || 'Código enviado al correo.');
        setView('reset');
      } else {
        setError(response.data.message || 'Error al solicitar el código.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email.trim() || !code.trim() || !newPassword) {
      setError('Por favor, complete todos los campos.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const response = await axios.post('/api/auth/reset-password', {
        email: email.trim(),
        code: code.trim(),
        newPassword
      });
      if (response.data.success) {
        setSuccessMsg(response.data.message || 'Contraseña cambiada exitosamente.');
        setView('login');
        setPassword('');
        setCode('');
      } else {
        setError(response.data.message || 'Error al restablecer la contraseña.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Por favor, complete todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Petición al endpoint de login de nuestro backend
      const response = await axios.post('/api/auth/login', {
        username: username.trim(),
        password
      });

      const { success, token, message } = response.data;

      if (success && token) {
        const decoded = decodeToken(token);
        if (decoded) {
          // Limpiamos los roles eliminando posibles espacios en blanco (ej: "INV_BODEGUERO ")
          const roles = (decoded.roles || []).map((r) => r.trim());
          const permissions = decoded.permissions || [];

          // Guardamos el token y los datos del usuario en localStorage
          localStorage.setItem('token', token);
          localStorage.setItem(
            'user',
            JSON.stringify({
              userName: decoded.user_name,
              roles,
              permissions
            })
          );

          // Redireccionar al panel principal
          navigate('/');
        } else {
          setError('Error al leer los permisos del token.');
        }
      } else {
        setError(message || 'Error al iniciar sesión.');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Credenciales incorrectas o error al conectar con el servidor.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card card">
        <div className="login-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <img src={LogoUTN} alt="UTN Logo" style={{ width: '140px', height: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="brand-logo" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(209,10,17,0.1)', padding: '12px', borderRadius: '50%', marginBottom: '16px' }}>
            <Package size={32} color="#d10a11" />
          </div>
          <h2>Módulo Inventario</h2>
          <p>Gestión de Productos</p>
        </div>

        {error && (
          <div className="login-error-alert">
            <AlertTriangle size={18} className="error-icon" style={{ color: '#d10a11' }} />
            <span className="error-text">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="login-error-alert" style={{ background: 'rgba(26,122,26,0.1)', border: '1px solid #1a7a1a', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="error-text" style={{ color: '#1a7a1a', fontWeight: 'bold' }}>{successMsg}</span>
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Usuario o Cédula</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingrese su usuario o cédula"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} color="#666" /> : <Eye size={18} color="#666" />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: '6px' }}>
                <span 
                  style={{ fontSize: '12px', color: '#d10a11', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }} 
                  onClick={() => { setView('forgot'); setError(''); setSuccessMsg(''); }}
                >
                  ¿Olvidé mi contraseña?
                </span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
            </button>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="login-form">
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px', textAlign: 'center' }}>
              Ingrese su correo electrónico registrado. Le enviaremos un código de 6 dígitos para restablecer su contraseña.
            </p>
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input 
                type="email" 
                id="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="ejemplo@correo.com" 
                disabled={loading} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Código'}
            </button>
            <button 
              type="button" 
              className="btn w-100" 
              style={{ background: '#f5f5f5', color: '#333', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '13px', borderRadius: '8px', fontSize: '15px', fontWeight: '700' }} 
              onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }} 
              disabled={loading}
            >
              Volver al Login
            </button>
          </form>
        )}

        {view === 'reset' && (
          <form onSubmit={handleResetPassword} className="login-form">
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px', textAlign: 'center' }}>
              Ingrese el código que enviamos a <strong>{email}</strong> y su nueva contraseña.
            </p>
            <div className="form-group">
              <label htmlFor="code">Código de 6 dígitos</label>
              <input 
                type="text" 
                id="code" 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                placeholder="123456" 
                maxLength={6} 
                disabled={loading} 
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">Nueva Contraseña</label>
              <div className="password-input-wrapper">
                <input 
                  type={showNewPassword ? 'text' : 'password'} 
                  id="newPassword" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Ingrese nueva contraseña" 
                  disabled={loading} 
                  required 
                />
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  title={showNewPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  disabled={loading}
                >
                  {showNewPassword ? <EyeOff size={18} color="#666" /> : <Eye size={18} color="#666" />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Procesando...' : 'Restablecer Contraseña'}
            </button>
            <button 
              type="button" 
              className="btn w-100" 
              style={{ background: '#f5f5f5', color: '#333', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '13px', borderRadius: '8px', fontSize: '15px', fontWeight: '700' }} 
              onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }} 
              disabled={loading}
            >
              Volver al Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
