const auth = require('./auth');

const apiKeyAuth = (req, res, next) => {
    // Buscar la API Key en el header "x-api-key"
    const apiKey = req.header('x-api-key');
    const validApiKey = process.env.EXTERNAL_API_KEY;

    // Si no está configurada la llave en el .env, denegar por seguridad
    if (!validApiKey) {
        return res.status(500).json({ msg: 'Error de servidor: EXTERNAL_API_KEY no configurada.' });
    }

    // Si se proporcionó una API Key, validarla
    if (apiKey) {
        if (apiKey === validApiKey) {
            return next(); // Clave correcta, permitir acceso
        }
        return res.status(403).json({ msg: 'API Key inválida, acceso denegado.' });
    }

    // Si NO hay API Key, intentamos validar mediante JWT (el token del frontend)
    return auth(req, res, next);
};

module.exports = apiKeyAuth;
