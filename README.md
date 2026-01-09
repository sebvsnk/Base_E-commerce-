# Base E-commerce Project

Una base sólida para un sistema de E-commerce moderno, construida con un backend robusto en Node.js y un frontend dinámico en React.

## 🚀 Tecnologías

### Backend (`/api`)
- **Node.js & Express**: Servidor API rápido y minimalista.
- **Prisma ORM (v7)**: Gestión de base de datos con tipado fuerte.
- **PostgreSQL (Supabase)**: Base de datos relacional escalable.
- **JWT**: Autenticación segura basada en tokens.
- **Zod**: Validación de esquemas de datos.

### Frontend (`/web`)
- **React**: Biblioteca para interfaces de usuario.
- **Vite**: Herramienta de construcción ultra rápida.
- **Vanilla CSS**: Estilos personalizados y optimizados.

## 🛠️ Características Principales

- **Base de Datos Normalizada (3NF)**: Estructura eficiente para productos, categorías, usuarios y pedidos.
- **Gestión de Direcciones**: Sistema de Regiones y Ciudades (Chile) integrado.
- **Autenticación**: Registro e inicio de sesión con validación de **RUN Chileno**.
- **Seguridad**: Contraseñas hasheadas con bcrypt y protección de rutas.
- **Integración de Pagos**: Preparado para integración con Webpay Plus.

## 📋 Requisitos Previos

- Node.js (v18 o superior)
- npm o yarn
- Una cuenta en [Supabase](https://supabase.com) para la base de datos.

## ⚙️ Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/sebvsnk/Base_E-commerce-.git
cd Base_E-commerce-
```

### 2. Configurar el Backend
```bash
cd api
npm install
```
Crea un archivo `.env` en la carpeta `api/` con las siguientes variables:
```env
PORT=4000
DATABASE_URL="tu_url_de_pooler_supabase"
DIRECT_URL="tu_url_directa_supabase"
JWT_SECRET="tu_clave_secreta"
```
Sincroniza la base de datos:
```bash
npx prisma db push
```

### 3. Configurar el Frontend
```bash
cd ../web
npm install
```

## 🚀 Ejecución

### Backend
```bash
cd api
npm run dev
```

### Frontend
```bash
cd web
npm run dev
```

## 📄 Noir
Saludos.