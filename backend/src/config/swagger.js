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
    },
    // Rutas donde Swagger buscará los comentarios para generar la documentación
    apis: ['./src/routes/*.js', './src/models/*.js'], 
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerDocs = (app, port) => {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log(`Documentación de Swagger disponible en http://localhost:${port}/api/docs`);
};

module.exports = swaggerDocs;
