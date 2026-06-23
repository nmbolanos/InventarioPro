# InventarioPro
Sistema de gestión de inventario desarrollado por el grupo.

## Dockerización

La aplicación se puede levantar con Docker Compose desde la raíz del proyecto.

1. Copia [.env.example](.env.example) a [.env](.env) y completa `DATABASE_URL` con tu cadena de Supabase.
2. Ejecuta `docker compose up --build`.
3. Abre el frontend en `http://localhost:8080`.
4. El backend queda disponible en `http://localhost:3000` y la documentación Swagger en `http://localhost:3000/api/docs`.
