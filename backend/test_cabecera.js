const pool = require('./src/config/db');

async function syncSequence() {
    try {
        console.log("Synchronizing sequence seq_numero_ajuste...");
        const syncRes = await pool.query(`
            SELECT setval(
                'seq_numero_ajuste', 
                COALESCE((SELECT MAX(CAST(SUBSTRING(numero_ajuste FROM 6) AS INTEGER)) FROM ajuste_cabecera), 1), 
                true
            )
        `);
        console.log("Sequence synchronized successfully! Result:", syncRes.rows[0]);

        console.log("Verifying next sequence value...");
        const seqStatus = await pool.query("SELECT last_value, is_called FROM seq_numero_ajuste");
        console.table(seqStatus.rows);

    } catch (error) {
        console.error("Error during sequence synchronization:", error);
    } finally {
        await pool.end();
    }
}

syncSequence();
