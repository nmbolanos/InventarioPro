const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API InventarioPro - Módulo Inventario',
            version: '1.0.0',
            description: 'Documentación de la API para la administración de productos (HU1) y salida para otros módulos.',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor Local de Desarrollo',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Ingrese el token JWT obtenido del endpoint POST /api/auth/login. Formato: Bearer <token>'
                },
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-api-key',
                    description: 'Clave API exclusiva para módulos externos (Compras y Facturación)'
                }
            }
        },
        security: [{ bearerAuth: [] }],
    },
    // Rutas donde Swagger buscará los comentarios para generar la documentación
    apis: ['./src/routes/*.js', './src/models/*.js'], 
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerDocs = (app) => {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = swaggerDocs;
