const express = require('express');
const router = express.Router();
const axios = require('axios');

const GRAPHQL_URL = 'https://proyecto-moduloseguridad.onrender.com/graphql/';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'El usuario y la contraseña son requeridos.' });
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
      variables: { username, password }
    }, {
      timeout: 10000 // 10 segundos de timeout
    });

    const result = response.data;

    if (result.errors) {
      return res.status(400).json({ 
        success: false, 
        message: result.errors[0].message || 'Error en la petición a la API de Seguridad.' 
      });
    }

    const { success, token, message } = result.data.login;

    if (!success) {
      return res.status(401).json({ success: false, message: message || 'Credenciales inválidas.' });
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
