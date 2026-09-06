Sistema de Inventario y Ventas Cams

Requisitos Previos
-----------------
- Node.js v20+
- Docker Desktop (opcional) o PostgreSQL instalado en Windows

Pasos para Correr
-----------------
1. Clonar repositorio
   git clone https://github.com/LuisAngel21-code/sistema-inventario-y-ventas-cams.git
   cd sistema-inventario-y-ventas-cams

2. Levantar Base de Datos
   Opcion Docker:
   docker run --name pg-cams -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tienda_cams -p 5432:5432 -d postgres:15

   Opcion PostgreSQL instalado:
   createdb tienda_cams

3. Configurar Variables de Entorno
   Copiar backend/.env y ajustar DATABASE_URL si es necesario:
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tienda_cams
   JWT_SECRET=cams_secret_local
   PORT=3000
   CORS_ORIGIN=http://localhost:5173

4. Instalar Dependencias
   npm run install:all

5. Ejecutar la Aplicacion
   npm run dev

Credenciales de Prueba
----------------------
Usuarios creados con contraseña cams2026:
- admin@cams.com (admin)
- almacen@cams.com (encargado_almacen)
- produccion@cams.com (jefe_produccion)
- ventas@cams.com (agente_ventas)
- jefe@cams.com (jefe)
- admincamas@2.com (administradora)