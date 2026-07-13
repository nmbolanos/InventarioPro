const path = require('path');
const axios = require('axios');
const protobuf = require('protobufjs');

const protoPath = path.join(__dirname, '..', 'config', 'auditoria.proto');
const auditUrl = 'https://712286fsib.execute-api.us-east-1.amazonaws.com/default/api-auth-central';

// Mapeo de rutas a IDs de funciones y descripciones
function obtenerDetalleAccion(req) {
  const method = req.method;
  const pathUrl = req.baseUrl || req.path;
  const user = req.user ? req.user.user_name : 'Usuario Anónimo';

  let idFuncion = 100; // Por defecto general
  let accion = method;
  let descripcion = `El usuario ${user} realizó una acción en ${pathUrl}`;
  let observacion = '';

  // Rutas de Productos
  if (pathUrl.includes('/api/productos')) {
    if (method === 'POST') {
      idFuncion = 101;
      accion = 'CREAR';
      descripcion = `El usuario ${user} creó el producto ${req.body.nombre || ''}`;
      observacion = `Código: ${req.body.codigo || 'N/D'}, PVP: ${req.body.pvp || 0}`;
    } else if (method === 'PUT') {
      idFuncion = 102;
      accion = 'ACTUALIZAR';
      descripcion = `El usuario ${user} actualizó el producto con código ${req.params.codigo || ''}`;
      observacion = `Datos enviados: ${JSON.stringify(req.body)}`;
    } else if (method === 'PATCH' && req.path.includes('/desactivar')) {
      idFuncion = 103;
      accion = 'DESACTIVAR';
      descripcion = `El usuario ${user} desactivó el producto con código ${req.params.codigo || ''}`;
      observacion = `Producto marcado como inactivo.`;
    }
  }
  // Rutas de Ajustes de Inventario
  else if (pathUrl.includes('/api/ajustes')) {
    if (method === 'POST') {
      idFuncion = 104;
      accion = 'CREAR';
      descripcion = `El usuario ${user} creó un nuevo ajuste de inventario`;
      observacion = `Descripción ajuste: ${req.body.descripcion || ''}`;
    } else if (method === 'PUT') {
      idFuncion = 105;
      accion = 'ACTUALIZAR';
      descripcion = `El usuario ${user} actualizó el ajuste de inventario ${req.params.id || ''}`;
      observacion = `Cambios: ${JSON.stringify(req.body)}`;
    } else if (method === 'DELETE') {
      idFuncion = 106;
      accion = 'ELIMINAR';
      descripcion = `El usuario ${user} eliminó el ajuste de inventario ${req.params.id || ''}`;
      observacion = `ID eliminado: ${req.params.id || ''}`;
    }
  }

  return { idFuncion, accion, descripcion, observacion };
}

module.exports = async (req, res, next) => {
  // Solo auditamos métodos de escritura que modifican el estado (POST, PUT, DELETE, PATCH)
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }

  // Interceptamos la finalización de la respuesta
  res.on('finish', async () => {
    // Solo enviamos a la auditoría si la operación fue exitosa (200, 201, 204)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const token = req.userToken;
        if (!token) {
          console.warn("Auditoría Omitida: No se encontró token de sesión en la petición.");
          return;
        }

        const { idFuncion, accion, descripcion, observacion } = obtenerDetalleAccion(req);
        const ipUsuario = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

        // Cargar el archivo .proto
        const root = await protobuf.load(protoPath);
        const AuditoriaRequest = root.lookupType('AuditoriaRequest');

        // Estructurar el mensaje con camelCase (mapeo automático de protobufjs a snake_case)
        const payload = {
          token,
          idFuncion,
          accion,
          descripcion,
          observacion,
          ipUsuario
        };

        // Validar y serializar a binario
        const errMsg = AuditoriaRequest.verify(payload);
        if (errMsg) {
          console.error("Error al verificar payload de auditoría:", errMsg);
          return;
        }

        const message = AuditoriaRequest.create(payload);
        const buffer = AuditoriaRequest.encode(message).finish();

        console.log(`[Auditoría] Enviando log de acción "${accion}" a AWS...`);

        // Enviar petición POST binaria a AWS
        const response = await axios.post(auditUrl, buffer, {
          headers: {
            'Content-Type': 'application/x-protobuf'
          },
          timeout: 5000 // Timeout de 5s para evitar que bloquee el hilo si la API de seguridad falla
        });

        console.log(`[Auditoría] Log registrado con éxito en AWS. Código de respuesta: ${response.status}`);
      } catch (err) {
        // Importante: Si la API de seguridad falla con 401 (ej. firma inválida) o 500, capturamos el error
        // para que no afecte la experiencia del usuario final ni interrumpa el flujo del inventario.
        console.error("[Auditoría] Error al enviar log a AWS:", err.response ? { status: err.response.status, data: err.response.data } : err.message);
      }
    }
  });

  next();
};
