const express = require('express');
const router = express.Router();
const axios = require('axios');

const GRAPHQL_URL = 'https://proyecto-moduloseguridad.onrender.com/graphql/';

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

module.exports = router;
