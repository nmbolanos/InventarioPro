const apiKeyAuth = (req, res, next) => {
    // Buscar la API Key en el header "x-api-key"
    const apiKey = req.header('x-api-key');
    const validApiKey = process.env.EXTERNAL_API_KEY;

    // Si no está configurada la llave en el .env, denegar por seguridad
    if (!validApiKey) {
        return res.status(500).json({ msg: 'Error de servidor: EXTERNAL_API_KEY no configurada.' });
    }

    if (!apiKey) {
        return res.status(401).json({ msg: 'No se proporcionó API Key (x-api-key), acceso denegado.' });
    }

    if (apiKey !== validApiKey) {
        return res.status(403).json({ msg: 'API Key inválida, acceso denegado.' });
    }

    // Si la clave es correcta, permite el acceso
    next();
};

module.exports = apiKeyAuth;
