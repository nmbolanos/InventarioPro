const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

async function main() {
  try {
    const cabecera = await prisma.ajuste_cabecera.create({
      data: {
        descripcion: "Prueba de Prisma con Trigger",
        fecha: new Date(),
        impreso: false
      }
    });
    console.log("Cabecera insertada:", cabecera);
    await prisma.ajuste_cabecera.delete({ where: { numero_ajuste: cabecera.numero_ajuste } });
    console.log("Borrado exitoso");
  } catch (e) {
    console.error("Error insertando:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
