require('dotenv').config();
const express = require('express');
const cors = require("cors");
const reportesRoutes = require('./routes/reportes');

// Importar rutas y middlewares
const productoRoutes = require("./routes/productoRoutes");
const ajusteCabeceraRoutes = require("./routes/ajusteCabecera");
const ajusteDetalleRoutes = require("./routes/ajusteDetalle");
const dashboardRoutes = require('./routes/dashboard');

const authRoutes = require("./routes/auth");
const auditMiddleware = require("./middleware/auditoria");

const app = express();
const swaggerDocs = require('./config/swagger');

app.use(cors());
app.use(express.json());

// Montar Swagger ANTES de las rutas protegidas para que /api/docs no sea bloqueado
swaggerDocs(app);
app.use('/api/dashboard', dashboardRoutes);

// Montar middleware global de auditoría (intercepta POST, PUT, DELETE, PATCH de todas las rutas)
app.use(auditMiddleware);

// Montar rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/ajustes/cabecera", ajusteCabeceraRoutes);
app.use("/api/ajustes/detalle", ajusteDetalleRoutes);
app.use("/api", reportesRoutes);

// Ruta principal
app.get("/", (req, res) => {
    res.send("API Inventario funcionando");
});

// Ruta para probar PostgreSQL con Prisma
app.get("/probar-db", async (req, res) => {
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const resultado = await prisma.$queryRaw`SELECT NOW()`;

        res.json({
            mensaje: "Conectado a PostgreSQL correctamente (vía Prisma)",
            fecha: resultado[0]
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al conectar con PostgreSQL",
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Documentación de Swagger disponible en http://localhost:${PORT}/api/docs`);
});
