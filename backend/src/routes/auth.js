const express = require('express');
const router = express.Router();
const axios = require('axios');

const GRAPHQL_URL = 'https://proyecto-moduloseguridad.onrender.com/graphql/';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Obtiene un token JWT para autenticarse en los endpoints protegidos
 *     tags: [Autenticación]
 *     description: |
 *       Envía las credenciales del usuario al módulo de Seguridad Centralizada.
 *       Si son válidas, retorna un token JWT que debe incluirse en el header
 *       `Authorization: Bearer <token>` de las demás peticiones.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nombre de usuario o cédula
 *                 example: CarlosRueda
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *                 example: C@rlos123.
 *     responses:
 *       200:
 *         description: Login exitoso. Retorna el token JWT.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: Token JWT para usar en el header Authorization
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 message:
 *                   type: string
 *                   example: Inicio de sesión exitoso
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error de conexión con el servidor de Seguridad
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'El usuario y la contraseña son requeridos.' });
  }

  let loginUsername = username.trim();

  // Consultar la lista de usuarios para verificar si ingresó una cédula
  try {
    const usersResponse = await axios.post(GRAPHQL_URL, {
      query: `
        query {
          usuarios {
            userName
            cedula
          }
        }
      `
    }, {
      timeout: 5000
    });

    const users = usersResponse.data?.data?.usuarios || [];
    const foundUser = users.find(
      u => u.cedula === loginUsername || u.userName.toLowerCase() === loginUsername.toLowerCase()
    );

    if (foundUser) {
      loginUsername = foundUser.userName;
    }
  } catch (err) {
    console.error('Error al resolver la cédula en pre-login:', err.message);
  }

  const loginMutation = `
    mutation Login($username: String!, $password: String!) {
      login(username: $username, password: $password) {
        success
        token
        message
      }
    }
  `;

  try {
    const response = await axios.post(GRAPHQL_URL, {
      query: loginMutation,
      variables: { username: loginUsername, password }
    }, {
      timeout: 10000 // 10 segundos de timeout
    });

    const result = response.data;

    if (result.errors) {
      let errMessage = result.errors[0].message || 'Error en la petición a la API de Seguridad.';
      if (errMessage.includes('Usuario no existe en Seguridades')) {
        errMessage = 'Usuario no registrado';
      }
      return res.status(400).json({ 
        success: false, 
        message: errMessage
      });
    }

    const { success, token, message } = result.data.login;

    if (!success) {
      let cleanMessage = message || 'Credenciales inválidas.';
      if (cleanMessage.includes('Usuario no existe en Seguridades')) {
        cleanMessage = 'Usuario no registrado';
      } else if (cleanMessage.includes('Credenciales inválidas')) {
        cleanMessage = 'Credenciales inválidas.';
      }
      return res.status(401).json({ success: false, message: cleanMessage });
    }

    return res.json({
      success: true,
      token,
      message: message || 'Inicio de sesión exitoso.'
    });

  } catch (error) {
    console.error('Error de comunicación con la API de Seguridad:', error.message);
    return res.status(500).json({
      success: false,
      message: 'No se pudo conectar con el servidor de Seguridad Centralizada. Inténtelo más tarde.'
    });
  }
});

// Ruta para solicitar el código de recuperación
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'El correo es requerido.' });
  }

  const forgotPasswordMutation = `
    mutation ForgotPassword($email: String!) {
      forgotPassword(email: $email) {
        success
        message
      }
    }
  `;

  try {
    const response = await axios.post(GRAPHQL_URL, {
      query: forgotPasswordMutation,
      variables: { email }
    }, { timeout: 10000 });

    const result = response.data;
    if (result.errors) {
      return res.status(400).json({ success: false, message: result.errors[0].message });
    }

    const { success, message } = result.data.forgotPassword;
    return res.status(success ? 200 : 400).json({ success, message });
  } catch (error) {
    console.error('Error en forgot-password:', error.message);
    return res.status(500).json({ success: false, message: 'Error de conexión con el servidor de Seguridad.' });
  }
});

// Ruta para restablecer la contraseña
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
  }

  const resetPasswordMutation = `
    mutation ResetPassword($email: String!, $codigo: String!, $password: String!, $confirmPassword: String!) {
      resetPassword(email: $email, codigo: $codigo, password: $password, confirmPassword: $confirmPassword) {
        success
        message
      }
    }
  `;

  try {
    const response = await axios.post(GRAPHQL_URL, {
      query: resetPasswordMutation,
      variables: { 
        email, 
        codigo: code, 
        password: newPassword, 
        confirmPassword: newPassword 
      }
    }, { timeout: 10000 });

    const result = response.data;
    if (result.errors) {
      return res.status(400).json({ success: false, message: result.errors[0].message });
    }

    const { success, message } = result.data.resetPassword;
    return res.status(success ? 200 : 400).json({ success, message });
  } catch (error) {
    console.error('Error en reset-password:', error.message);
    return res.status(500).json({ success: false, message: 'Error de conexión con el servidor de Seguridad.' });
  }
});

module.exports = router;
