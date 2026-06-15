const fs = require('fs');
const path = require('path');
const pool = require('../backend/src/config/db');

async function runSetup() {
    try {
        const sqlPath = path.join(__dirname, 'ScriptDatabase.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log("Ejecutando script de base de datos...");
        await pool.query(sql);
        console.log("¡Tablas creadas y datos de prueba insertados con éxito!");
        process.exit(0);
    } catch (error) {
        console.error("Error al ejecutar el script de configuración:", error);
        process.exit(1);
    }
}

runSetup();
