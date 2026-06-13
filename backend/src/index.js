const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
const productoRoutes = require('./routes/productoRoutes');

app.use('/api/productos', productoRoutes);

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