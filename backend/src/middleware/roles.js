const checkPermission = (allowedPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
    }

    // Extraemos y limpiamos los permisos del usuario
    const userPermissions = (req.user.permissions || []).map(perm => typeof perm === 'string' ? perm.trim() : '');

    // Comprobamos si el usuario tiene al menos uno de los permisos permitidos
    const hasPermission = allowedPermissions.some(allowed => userPermissions.includes(allowed.trim()));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Requiere uno de los siguientes permisos: [${allowedPermissions.join(', ')}]`
      });
    }

    next();
  };
};

module.exports = {
  checkPermission
};
