const assert = require('assert');

async function testBackend() {
    console.log("=== INICIANDO PRUEBAS DE INTEGRACIÓN ===");

    const baseUrl = 'http://localhost:3000/api';

    try {
        // --- 1. Obtener productos iniciales ---
        console.log("\n1. Obteniendo productos iniciales...");
        const resProd = await fetch(`${baseUrl}/productos`);
        const productos = await resProd.json();
        console.log("Productos en la base de datos:");
        console.table(productos.map(p => ({ id: p.id, codigo: p.codigo, nombre: p.nombre, stock: p.stock })));

        const prod1 = productos.find(p => p.codigo === 'PROD-0001'); // Stock: 50
        const prod2 = productos.find(p => p.codigo === 'PROD-0002'); // Stock: 30
        const prod3 = productos.find(p => p.codigo === 'PROD-0003'); // Stock: 15
        const prod4 = productos.find(p => p.codigo === 'PROD-0004'); // Stock: 0

        assert(prod1 && prod2 && prod3 && prod4, "Deberían estar los productos de prueba");

        // --- 2. Crear Ajuste Cabecera 1 ---
        console.log("\n2. Creando primer Ajuste Cabecera (debe generar AJUS-0001)...");
        const resCab1 = await fetch(`${baseUrl}/ajustes/cabecera`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motivo: 'Ajuste inicial de prueba', observacion: 'Verificación de correlativos' })
        });
        const cab1 = await resCab1.json();
        console.log("Cabecera 1 creada:", cab1);
        assert.strictEqual(cab1.numero_ajuste, 'AJUS-0001', "El número de ajuste debería ser AJUS-0001");

        // --- 3. Crear Ajuste Cabecera 2 ---
        console.log("\n3. Creando segundo Ajuste Cabecera (debe generar AJUS-0002)...");
        const resCab2 = await fetch(`${baseUrl}/ajustes/cabecera`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motivo: 'Ajuste secundario', observacion: 'Prueba número de ajuste correlativo' })
        });
        const cab2 = await resCab2.json();
        console.log("Cabecera 2 creada:", cab2);
        assert.strictEqual(cab2.numero_ajuste, 'AJUS-0002', "El número de ajuste debería ser AJUS-0002");

        // --- 4. Crear Ajuste Detalle (Cantidad Positiva) ---
        console.log(`\n4. Creando Ajuste Detalle positivo (+10) para "${prod1.nombre}" (ID: ${prod1.id}, Stock actual: 50)...`);
        const resDet1 = await fetch(`${baseUrl}/ajustes/detalle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ajuste_cabecera_id: cab1.id,
                producto_id: prod1.id,
                cantidad: 10
            })
        });
        const det1 = await resDet1.json();
        console.log("Detalle 1 creado:", det1);
        assert.strictEqual(det1.cantidad, 10, "La cantidad del detalle debe ser 10");

        // Validar que el stock del producto 1 subió a 60
        const resProd1Check = await fetch(`${baseUrl}/productos/${prod1.id}`);
        const prod1Check = await resProd1Check.json();
        console.log(`Verificación de stock de "${prod1.nombre}": actual=${prod1Check.stock} (esperado=60)`);
        assert.strictEqual(prod1Check.stock, 60, "El stock debería haber subido a 60");

        // --- 5. Crear Ajuste Detalle (Cantidad Negativa) ---
        console.log(`\n5. Creando Ajuste Detalle negativo (-5) para "${prod2.nombre}" (ID: ${prod2.id}, Stock actual: 30)...`);
        const resDet2 = await fetch(`${baseUrl}/ajustes/detalle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ajuste_cabecera_id: cab1.id,
                producto_id: prod2.id,
                cantidad: -5
            })
        });
        const det2 = await resDet2.json();
        console.log("Detalle 2 creado:", det2);
        assert.strictEqual(det2.cantidad, -5, "La cantidad del detalle debe ser -5");

        // Validar que el stock del producto 2 bajó a 25
        const resProd2Check = await fetch(`${baseUrl}/productos/${prod2.id}`);
        const prod2Check = await resProd2Check.json();
        console.log(`Verificación de stock de "${prod2.nombre}": actual=${prod2Check.stock} (esperado=25)`);
        assert.strictEqual(prod2Check.stock, 25, "El stock debería haber bajado a 25");

        // --- 6. Validación de Stock Insuficiente (Ajuste Negativo Excesivo) ---
        console.log(`\n6. Validando stock: Intentando ajustar -100 para "${prod3.nombre}" (ID: ${prod3.id}, Stock actual: 15)...`);
        const resDet3 = await fetch(`${baseUrl}/ajustes/detalle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ajuste_cabecera_id: cab1.id,
                producto_id: prod3.id,
                cantidad: -100
            })
        });
        const det3Response = await resDet3.json();
        console.log("Respuesta del servidor (esperado error):", det3Response);
        assert.strictEqual(resDet3.status, 400, "Debería retornar un código de estado 400 Bad Request");
        assert(det3Response.error.includes("Stock insuficiente"), "El mensaje de error debería mencionar 'Stock insuficiente'");

        // Validar que el stock del producto 3 sigue siendo 15
        const resProd3Check = await fetch(`${baseUrl}/productos/${prod3.id}`);
        const prod3Check = await resProd3Check.json();
        console.log(`Verificación de stock de "${prod3.nombre}": actual=${prod3Check.stock} (esperado=15)`);
        assert.strictEqual(prod3Check.stock, 15, "El stock no debería haber cambiado");

        // --- 7. Actualizar Ajuste Detalle (Modificar cantidad y ver el stock recalculado) ---
        console.log(`\n7. Actualizando Detalle 1: cambiando cantidad de +10 a +5 en "${prod1.nombre}"...`);
        const resDet1Update = await fetch(`${baseUrl}/ajustes/detalle/${det1.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                producto_id: prod1.id,
                cantidad: 5
            })
        });
        const det1Update = await resDet1Update.json();
        console.log("Detalle 1 actualizado:", det1Update);
        assert.strictEqual(det1Update.cantidad, 5, "La nueva cantidad debe ser 5");

        // Validar que el stock del producto 1 bajó a 55 (50 original + 5 nuevo)
        const resProd1Check2 = await fetch(`${baseUrl}/productos/${prod1.id}`);
        const prod1Check2 = await resProd1Check2.json();
        console.log(`Verificación de stock de "${prod1.nombre}": actual=${prod1Check2.stock} (esperado=55)`);
        assert.strictEqual(prod1Check2.stock, 55, "El stock debería ser 55");

        // --- 8. Eliminar Ajuste Detalle ---
        console.log(`\n8. Eliminando Detalle 2 (Mouse Gamer Pro, -5 cantidad) para revertir su stock a 30...`);
        const resDet2Delete = await fetch(`${baseUrl}/ajustes/detalle/${det2.id}`, {
            method: 'DELETE'
        });
        const det2DeleteRes = await resDet2Delete.json();
        console.log("Respuesta de eliminación:", det2DeleteRes);

        // Validar que el stock del producto 2 subió de nuevo a 30
        const resProd2Check2 = await fetch(`${baseUrl}/productos/${prod2.id}`);
        const prod2Check2 = await resProd2Check2.json();
        console.log(`Verificación de stock de "${prod2.nombre}": actual=${prod2Check2.stock} (esperado=30)`);
        assert.strictEqual(prod2Check2.stock, 30, "El stock debería haber retornado a 30");

        // --- 9. Eliminar Ajuste Cabecera (debe borrar detalles y revertir sus stocks) ---
        console.log(`\n9. Eliminando Cabecera 1 (debe borrar sus detalles remanentes y revertir su stock)...`);
        // Nota: el detalle remanente es det1 con cantidad +5 en producto 1.
        // Al eliminar la cabecera, se debe restar 5 del stock de producto 1, volviendo a 50.
        const resCab1Delete = await fetch(`${baseUrl}/ajustes/cabecera/${cab1.id}`, {
            method: 'DELETE'
        });
        const cab1DeleteRes = await resCab1Delete.json();
        console.log("Respuesta de eliminación de cabecera:", cab1DeleteRes);

        // Validar que el stock del producto 1 volvió a 50
        const resProd1Check3 = await fetch(`${baseUrl}/productos/${prod1.id}`);
        const prod1Check3 = await resProd1Check3.json();
        console.log(`Verificación de stock de "${prod1.nombre}": actual=${prod1Check3.stock} (esperado=50)`);
        assert.strictEqual(prod1Check3.stock, 50, "El stock debería haber retornado a 50");

        // Verificar que los detalles de la cabecera 1 ya no existen
        const resDetallesCab1 = await fetch(`${baseUrl}/ajustes/detalle/cabecera/${cab1.id}`);
        assert.strictEqual(resDetallesCab1.status, 404, "La cabecera ya no existe, debería retornar 404");

        console.log("\n=== ¡TODAS LAS PRUEBAS DE INTEGRACIÓN SE COMPLETARON CON ÉXITO! ===");

    } catch (error) {
        console.error("\n❌ ERROR EN LAS PRUEBAS DE INTEGRACIÓN:", error);
        process.exit(1);
    }
}

testBackend();
