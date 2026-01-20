# 🎨 Sistema de Gestión de Multimedia

## Descripción

El administrador ahora puede gestionar todas las imágenes de la tienda desde el portal de administración en la sección **Multimedia**.

## Características

### 📋 Secciones Disponibles

1. **Banners Principales** - Carrusel de banners en la página principal
   - `banner-1`: Primer banner del carrusel
   - `banner-2`: Segundo banner del carrusel
   - `banner-3`: Tercer banner del carrusel

2. **Imágenes de Categorías** - Tarjetas de categorías en la página principal
   - `category-1`: Categoría 1
   - `category-2`: Categoría 2
   - `category-3`: Categoría 3
   - `category-4`: Categoría 4
   - `category-5`: Categoría 5
   - `category-6`: Categoría 6

3. **Logos y Marca** - Logos del sitio
   - `header-logo`: Logo en el encabezado
   - `footer-logo`: Logo en el pie de página

4. **Promociones** - Banners promocionales
   - `promo-1`: Primera promoción
   - `promo-2`: Segunda promoción
   - `promo-3`: Tercera promoción

## 🚀 Cómo Usar

### Acceso

1. Inicia sesión como administrador en el portal admin
2. Navega a la sección **"Multimedia"** en el menú lateral (icono 🎨)

### Subir/Cambiar Imágenes

1. Selecciona la categoría de imagen que deseas gestionar (Banners, Categorías, etc.)
2. En cada tarjeta de sección, verás:
   - La imagen actual (si existe)
   - Un botón "Subir Imagen" o "Cambiar Imagen"
3. Haz clic en el botón y selecciona la imagen desde tu computadora
4. La imagen se subirá automáticamente y se actualizará en el sitio web

### Eliminar Imágenes

1. Coloca el cursor sobre una imagen existente
2. Aparecerá un botón "🗑️ Eliminar"
3. Haz clic para eliminar la imagen
4. Confirma la eliminación

### Características Técnicas

- **Tamaño máximo**: 10MB por imagen
- **Formatos soportados**: JPG, PNG, GIF, WEBP
- **Actualización**: Las imágenes se actualizan en tiempo real en el sitio web
- **Almacenamiento**: Las imágenes se almacenan en Supabase Storage

## 📊 Base de Datos

### Modelo `MediaAsset`

```prisma
model MediaAsset {
  id           String          @id @default(cuid())
  type         MediaAssetType  // BANNER, CATEGORY_IMAGE, LOGO, PROMOTION
  section      String          // 'banner-1', 'category-1', etc.
  title        String?
  url          String
  displayOrder Int             @default(0)
  isActive     Boolean         @default(true)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
}
```

## 🔧 API Endpoints

### GET `/api/media`
Obtiene todos los assets de multimedia

### GET `/api/media/type/:type`
Obtiene assets por tipo (BANNER, CATEGORY_IMAGE, LOGO, PROMOTION)

### GET `/api/media/section/:section`
Obtiene un asset específico por sección

### POST `/api/media`
Crea o actualiza un asset (requiere autenticación de admin)
- Body: FormData con `image`, `type`, `section`, `title`

### PATCH `/api/media/:id`
Actualiza propiedades de un asset (requiere autenticación de admin)

### DELETE `/api/media/:id`
Elimina un asset (requiere autenticación de admin)

## 🎯 Integración con el Sitio Web

Las páginas del sitio web cargan automáticamente las imágenes desde la base de datos:

- **Banner.tsx**: Carga los banners del carrusel principal
- **CategoryGrid.tsx**: Carga las imágenes de las categorías

Si no hay imágenes personalizadas, se mostrarán las imágenes placeholder por defecto.

## 🔐 Permisos

Solo los usuarios con rol **ADMIN** pueden:
- Subir nuevas imágenes
- Cambiar imágenes existentes
- Eliminar imágenes

Los usuarios con rol **WORKER** pueden ver las imágenes pero no modificarlas.

## 📝 Notas Importantes

1. Las imágenes se almacenan en Supabase Storage en el bucket `ecommerce-products`
2. El sistema mantiene un registro de cuándo se actualizó cada imagen
3. Cada combinación de `type` y `section` es única (no puede haber duplicados)
4. Las imágenes se sirven a través de URLs públicas de Supabase

## 🐛 Troubleshooting

### La imagen no se muestra después de subirla
- Verifica que el bucket de Supabase sea público
- Comprueba la consola del navegador para errores de CORS
- Asegúrate de que la URL de la API esté correctamente configurada

### Error al subir imagen
- Verifica que la imagen sea menor a 10MB
- Comprueba que el formato sea soportado (JPG, PNG, GIF, WEBP)
- Asegúrate de estar autenticado como administrador

### Las imágenes no se actualizan en el sitio web
- Refresca la página del sitio web
- Verifica que el servidor API esté ejecutándose
- Comprueba que las URLs de las imágenes sean accesibles
