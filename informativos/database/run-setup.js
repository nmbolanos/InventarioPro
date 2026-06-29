const fs = require('fs');
const path = require('path');
const pool = require('../backend/src/config/db');

async function runSetup() {
    try {
        console.log("Limpiando tablas antiguas...");
        await pool.query(`
            DROP TRIGGER IF EXISTS trg_asignar_numero_ajuste ON ajuste_cabecera;
            DROP FUNCTION IF EXISTS fn_generar_numero_ajuste;
            DROP TABLE IF EXISTS movimiento_kardex CASCADE;
            DROP TABLE IF EXISTS ajuste_detalle CASCADE;
            DROP TABLE IF EXISTS ajuste_cabecera CASCADE;
            DROP TABLE IF EXISTS producto CASCADE;
            DROP TABLE IF EXISTS productos CASCADE;
            DROP SEQUENCE IF EXISTS seq_numero_ajuste CASCADE;
        `);

        const scriptPath = path.join(__dirname, 'ScriptDatabase.sql');
        const scriptSql = fs.readFileSync(scriptPath, 'utf8');
        console.log("Creando tablas y configuración de base de datos...");
        await pool.query(scriptSql);

        const dataPath = path.join(__dirname, 'DatosPrueba.sql');
        const dataSql = fs.readFileSync(dataPath, 'utf8');
        console.log("Insertando datos de prueba...");
        await pool.query(dataSql);

        console.log("¡Configuración de la base de datos completada con éxito!");
        process.exit(0);
    } catch (error) {
        console.error("Error al configurar la base de datos:", error);
        process.exit(1);
    }
}

runSetup();
