const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const reportesRoutes = require('./routes/reportes');

// Importar rutas y middlewares
const productoRoutes = require("./routes/productoRoutes");
const ajusteCabeceraRoutes = require("./routes/ajusteCabecera");
const ajusteDetalleRoutes = require("./routes/ajusteDetalle");
const authRoutes = require("./routes/auth");
const auditMiddleware = require("./middleware/auditoria");

const app = express();

app.use(cors());
app.use(express.json());

// Montar middleware global de auditoría (intercepta POST, PUT, DELETE, PATCH de todas las rutas)
app.use(auditMiddleware);

// Montar rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/ajustes/cabecera", ajusteCabeceraRoutes);
app.use("/api/ajustes/detalle", ajusteDetalleRoutes);

// Ruta principal
app.get("/", (req, res) => {
    res.send("API Inventario funcionando");
});

// Ruta para probar PostgreSQL
app.get("/probar-db", async (req, res) => {
    try {
        const resultado = await pool.query("SELECT NOW()");

        res.json({
            mensaje: "Conectado a PostgreSQL correctamente",
            fecha: resultado.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al conectar con PostgreSQL",
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
const swaggerDocs = require('./config/swagger');

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    swaggerDocs(app, PORT);
});

app.use('/api/reportes', reportesRoutes);
