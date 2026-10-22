# Imágenes del catálogo y APK

## Recorrido real de los datos

1. `services/supabase.ts` conecta con el proyecto definido en `.env` al compilar la APK.
2. `repositories/productRepository.ts` consulta `productos`, incluido `imagen_url`.
3. `app/buscar.tsx` carga los productos y permite actualizar deslizando la lista hacia abajo.
4. `components/ProductCard.tsx` muestra la URL con React Native `Image` y `resizeMode="contain"`.
5. El escáner consulta el mismo registro por código de barras (`app/escanear.tsx`).
6. El carrito conserva el producto y su URL (`context/CartContext.tsx`, `components/CartItem.tsx`).

Las imágenes se descargan por HTTPS desde Supabase Storage. No dependen de localhost ni de tener la PC encendida. Esta aplicación requiere conexión para consultar el catálogo; no se ha implementado un catálogo offline.

## Actualización del 22 de octubre de 2026

Se prepararon 25 fotos de referencia, autorizadas por dosis y presentación. Las fuentes y diferencias conocidas están en `assets/product-images/manifest.json`. Las marcas de las fotos no identifican necesariamente el inventario físico. Panadol muestra un sobre de 2 tabletas, no la caja de 24; el jabón de referencia es de 400 ml y protección neutra, pero su envase no tiene dispensador.

Los JPEG locales tienen hasta 700 x 700 píxeles, fondo blanco y proporciones preservadas. `upload-report.json` registra el enlace público de cada imagen verificada. Las imágenes antiguas se conservan; las nuevas usan `productos/catalog-v2/BOT-000001-<hash>.jpg`. El hash cambia cuando cambia el archivo y evita reutilizar la foto anterior de la caché de Android.

## Cómo verlas en el celular

Si la APK instalada ya consulta este mismo proyecto y usa `productos.imagen_url`, basta abrir Buscar y deslizar la lista hacia abajo para recargar, o cerrar completamente y volver a abrir la app. No hace falta reinstalar por una actualización de datos o de URLs. No se ha verificado aquí el binario instalado en el teléfono.

Solo si cambia el código o la conexión incorporada en la APK hay que recompilar con `npm run build:apk` (Android SDK y Java configurados), o con el flujo EAS de `docs/deployment.md`, e instalar el nuevo APK firmado con la misma clave. `preview.html` es un simulador separado; modificarlo por sí solo no modifica la APK.

## Cómo repetir una actualización

1. Revisar foto, dosis, presentación y fuente en `manifest.json` contra el producto real. Preferir fotos propias para el catálogo definitivo.
2. Preparar JPEG: `node scripts/upload-product-images.js --prepare` (requiere `sharp`; puede resolverse mediante `NODE_PATH` desde el runtime de trabajo). Eliminar o reemplazar deliberadamente la copia local si se cambia su fuente, pues la preparación conserva archivos existentes.
3. Subir: `node scripts/upload-product-images.js --upload`. Lee `.env`; no incluye credenciales en el código. Subir requiere permisos de Storage; el script no cambia políticas.
4. Revisar `upload-report.json` y actualizar únicamente `productos.imagen_url`, identificando cada fila por `codigo_barras`. Aplicar `database/product_images_update.sql` para este lote. No ejecutar `seed.sql` para esto: también modifica precios y stock.
5. Verificar el catálogo consultando la API y comprobar cada imagen: `node scripts/upload-product-images.js --verify`. Verifica los bytes remotos contra el JPEG local.
6. Actualizar la lista en el teléfono y comprobar búsqueda, escaneo y carrito.

Las claves administrativas solo se utilizan en entornos de administración; nunca deben incorporarse al APK. La clave pública no sustituye políticas de acceso apropiadas.
