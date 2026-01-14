# E-commerce Project

Proyecto de E-commerce fullstack con Node.js (Express), Prisma, PostgreSQL y React (Vite).
Incluye autenticación, gestión de productos con imágenes en Cloudinary, carrito de compras y panel de administración completo.

## 📋 Requisitos Previos

- **Node.js** v18 o superior
- **PostgreSQL** (Local o en la nube como Supabase/Neon)
- **Cuenta en Cloudinary** (Gratuita, para subida de imágenes)

## 🚀 Configuración del Proyecto

Sigue estos pasos para levantar el proyecto desde cero.

### 1. Configuración del Backend (`api`)

El backend maneja la base de datos, autenticación y la API REST.

1.  **Entrar a la carpeta `api`**:
    ```bash
    cd api
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**:
    Crea un archivo `.env` en la carpeta `api` con las siguientes claves:

    ```env
    # Servidor
    PORT=4000
    
    # Base de Datos (PostgreSQL connection string)
    # Ejemplo: postgresql://usuario:password@localhost:5432/ecommerce?schema=public
    DATABASE_URL="tu_url_de_postgres"

    # Seguridad JWT
    JWT_SECRET="secreto_para_firmar_tokens"

    # Cloudinary (Imágenes) - Obtenlas en tu dashboard de Cloudinary
    CLOUDINARY_CLOUD_NAME="tu_cloud_name"
    CLOUDINARY_API_KEY="tu_api_key"
    CLOUDINARY_API_SECRET="tu_api_secret"

    # Configuración de Admin Inicial (Para el seed)
    ADMIN_RUN="11111111-1"
    ADMIN_EMAIL="admin@admin.com"
    ADMIN_PASSWORD="admin123"
    ```

4.  **Sincronizar Base de Datos**:
    ```bash
    # Generar cliente de Prisma (Tipos TypeScript)
    npx prisma generate

    # Empujar esquema a la Base de Datos
    npx prisma db push
    ```

5.  **Poblar Base de Datos (Seeds)**:
    Ejecuta los scripts para crear datos iniciales.
    ```bash
    # 1. Cargar Regiones y Comunas de Chile
    npx ts-node prisma/seed_regions.ts

    # 2. Crear Usuario Admin (Usa credenciales del .env)
    npx ts-node prisma/seed_admin.ts

    # 3. Cargar Productos de ejemplo
    npx ts-node prisma/seed.ts
    ```

6.  **Iniciar Servidor de Desarrollo**:
    ```bash
    npm run dev
    ```
    > El servidor API correrá en `http://localhost:4000`

---

### 2. Configuración del Frontend (`web`)

El frontend es una SPA construida con Vite y React.

1.  **Entrar a la carpeta `web`** (desde la raíz):
    ```bash
    cd web
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Iniciar Servidor de Desarrollo**:
    ```bash
    npm run dev
    ```
    > La aplicación abrirá automáticamente en `http://localhost:5173`

## 👤 Usuarios de Prueba

Si ejecutaste los seeds correctamente, podrás acceder al panel de administración con:

- **Rol Admin**:
    - **Email**: `admin@admin.com` (o el que hayas puesto en `.env`)
    - **Contraseña**: `admin123` (o la que hayas puesto en `.env`)

## 🛠️ Funcionalidades Principales

- **Catálogo de Productos**: 
    - Vista pública con filtros por categoría y precio.
    - Galería de imágenes detallada en vista de producto.
- **Carrito de Compras**: 
    - Gestión de estado local persistente.
    - Control de stock en tiempo real.
- **Panel de Admin**:
    - **Dashboard**: Métricas clave.
    - **Productos**: CRUD completo, subida de múltiples imágenes (Cloudinary), gestión de stock.
    - **Usuarios**: Listado y gestión de roles.
    - **Órdenes**: Visualización de historial de pedidos.
- **Imágenes**: 
    - Subida optimizada a Cloudinary.
    - Soporte para múltiples imágenes por producto con selección de portada.

## 📦 Estructura del Proyecto

```
/
├── api/                # Backend (Express + Prisma)
│   ├── prisma/         # Esquema de DB y Seeds
│   └── src/
│       ├── lib/        # Configs (Cloudinary, Prisma)
│       └── routes/     # Endpoints de la API
└── web/                # Frontend (React + Vite)
    └── src/
        ├── components/ # Componentes reutilizables
        ├── features/   # Lógica (Auth, Cart, Products)
        ├── pages/      # Vistas (Admin y Públicas)
        └── services/   # Comunicación con la API
```
