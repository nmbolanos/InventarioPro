-- CreateTable
CREATE TABLE "ajuste_cabecera" (
    "numero_ajuste" VARCHAR(20) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "fecha" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "impreso" BOOLEAN DEFAULT false,

    CONSTRAINT "ajuste_cabecera_pkey" PRIMARY KEY ("numero_ajuste")
);

-- CreateTable
CREATE TABLE "ajuste_detalle" (
    "id_detalle" SERIAL NOT NULL,
    "numero_ajuste" VARCHAR(20),
    "codigo_producto" VARCHAR(50),
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "ajuste_detalle_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "movimiento_kardex" (
    "id_movimiento" SERIAL NOT NULL,
    "codigo_producto" VARCHAR(50),
    "fecha" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "tipo_movimiento" VARCHAR(20) NOT NULL,
    "documento_referencia" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "costo_unitario" DECIMAL(10,2) NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "stock_resultante" INTEGER NOT NULL,

    CONSTRAINT "movimiento_kardex_pkey" PRIMARY KEY ("id_movimiento")
);

-- CreateTable
CREATE TABLE "producto" (
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),
    "graba_iva" BOOLEAN NOT NULL DEFAULT true,
    "costo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pvp" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estado" VARCHAR(15) NOT NULL DEFAULT 'Activo',
    "stock_actual" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "producto_pkey" PRIMARY KEY ("codigo")
);

-- AddForeignKey
ALTER TABLE "ajuste_detalle" ADD CONSTRAINT "ajuste_detalle_codigo_producto_fkey" FOREIGN KEY ("codigo_producto") REFERENCES "producto"("codigo") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajuste_detalle" ADD CONSTRAINT "ajuste_detalle_numero_ajuste_fkey" FOREIGN KEY ("numero_ajuste") REFERENCES "ajuste_cabecera"("numero_ajuste") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimiento_kardex" ADD CONSTRAINT "movimiento_kardex_codigo_producto_fkey" FOREIGN KEY ("codigo_producto") REFERENCES "producto"("codigo") ON DELETE NO ACTION ON UPDATE CASCADE;
