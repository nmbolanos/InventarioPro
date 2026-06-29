import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
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
          <div className="brand-logo">📦</div>
          <h2>InventarioPro</h2>
          <p>Módulo de Control de Inventario</p>
        </div>

        {error && (
          <div className="login-error-alert">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

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
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
