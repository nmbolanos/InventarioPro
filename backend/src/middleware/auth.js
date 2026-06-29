const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Token de autenticación no suministrado.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, message: 'Formato de token inválido. Use Bearer <token>' });
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    // Si no hay clave secreta configurada (ej: desarrollo), decodificamos el token sin verificar firma
    console.warn("ADVERTENCIA: JWT_SECRET no configurado. Decodificando token sin verificar la firma.");
    try {
      const decoded = jwt.decode(token);
      if (!decoded) {
        return res.status(401).json({ success: false, message: 'Token inválido o corrupto.' });
      }
      req.user = decoded;
      req.userToken = token; // Guardamos el token para enviarlo en auditoría si es necesario
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Error al decodificar el token.', error: err.message });
    }
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    req.userToken = token;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado.', error: err.message });
  }
};
