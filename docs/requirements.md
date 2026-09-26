# FarmaApp - Especificación de Requerimientos de Software

## 1. Introducción y Alcance del Proyecto

El proyecto **FarmaApp** es una solución móvil diseñada para digitalizar y optimizar el **proceso de atención y venta rápida de productos** en pequeñas boticas convencionales y farmacias de barrio.

### 1.1. Objetivo General
Transformar la atención al cliente mediante una aplicación móvil ágil que integre la búsqueda inteligente por texto, el escaneo óptico de códigos de barra por cámara, el cálculo automático de montos y el descuento atómico de inventario en tiempo real sobre una base de datos centralizada en la nube (Supabase PostgreSQL).

### 1.2. Alcance de la Primera Entrega (MVP)
* **Gestión de Catálogo y Consulta de Productos:** Visualización de nombre, código de barras, precio unitario, stock disponible y categoría.
* **Escaneo de Código de Barras (Code 128 / EAN):** Detección instantánea con la cámara del dispositivo móvil y recuperación de datos en tiempo real.
* **Carrito y Venta Rápida:** Incorporación de productos, ajuste dinámico de cantidades, cálculo de subtotales y total general.
* **Transacción Atómica de Venta:** Registro de venta con detalle y decremento inmediato de existencias garantizando integridad referencial.
* **Empaquetado Android APK:** Generación de paquete instalable independiente (`.apk`) para dispositivos físicos Android mediante Expo Application Services (EAS Build).

---

## 2. Requerimientos Funcionales (RF)

| ID | Nombre | Descripción | Entrada | Salida / Resultado |
| :--- | :--- | :--- | :--- | :--- |
| **RF-01** | Búsqueda de Productos | El sistema debe permitir ingresar texto (nombre completo o parcial) y buscar productos activos en el catálogo de la botica. | Cadena de texto de búsqueda | Lista de productos coincidentes con nombre, precio, stock, código y categoría |
| **RF-02** | Escaneo Óptico de Barras | El sistema debe capturar códigos de barras en formato Code 128, EAN-13, EAN-8 y UPC a través de la cámara del dispositivo. | Imagen / flujo de video capturado | Lectura del código (`BOT-XXXXXX`) y consulta automática en Supabase |
| **RF-03** | Consulta Detallada de Producto | El sistema debe presentar la ficha técnica del producto identificado por búsqueda o escaneo, indicando su disponibilidad. | Identificador o código de barras | Tarjeta con nombre, descripción, precio (S/), stock actual, alerta de stock mínimo |
| **RF-04** | Agregar Producto a la Venta | El usuario debe poder incorporar el producto seleccionado al carrito de venta actual. | Acción de agregar / cantidad inicial | Producto agregado al carrito con cálculo de subtotal |
| **RF-05** | Modificar Cantidad en Carrito | El usuario debe poder incrementar, decrementar o remover ítems de la venta actual con validación de límite de stock. | Controles (+ / - / eliminar) | Actualización de cantidad y recálculo de montos; bloqueo si supera stock |
| **RF-06** | Cálculo de Totales | El sistema debe calcular en tiempo real el subtotal por ítem ($subtotal = precio \times cantidad$) y el importe total de la venta ($\sum subtotales$). | Cantidades y precios unitarios | Total consolidado expresado en Soles (PEN - S/) |
| **RF-07** | Validación de Stock en Tiempo Real | El sistema debe verificar en la base de datos que existan unidades suficientes antes de registrar la venta. | Lista de ítems y cantidades solicitadas | Validación aprobada o alerta de existencias insuficientes |
| **RF-08** | Registro Atómico de Venta | Al confirmar la venta, el sistema debe crear el encabezado de venta, los registros de detalle y decrementar el stock en una única transacción ACID. | Confirmación de usuario, método de pago, cliente opcional | Registro exitoso en `ventas` y `detalle_ventas`, decremento en `productos` |
| **RF-09** | Feedback y Resumen de Venta | El sistema debe mostrar un diálogo/pantalla modal de éxito con el código de venta, total cobrado y confirmación de stock actualizado. | Finalización de transacción RPC | Notificación visual clara con opción de iniciar una nueva venta |
| **RF-10** | Manejo de Excepciones y Errores | El sistema debe notificar al usuario de forma clara ante: producto inexistente, cámara sin permiso, pérdida de conexión o stock agotado. | Eventos de error del sistema / red | Mensajes descriptivos no técnicos con botones de reintento |

---

## 3. Requerimientos No Funcionales (RNF)

```text
               ┌────────────────────────────────────────────────────────┐
               │         REQUERIMIENTOS NO FUNCIONALES (RNF)            │
               ├────────────────────────────────────────────────────────┤
               │  RNF-01: Usabilidad (Operación < 3 toques)             │
               │  RNF-02: Rendimiento (Respuesta de búsqueda < 500 ms)  │
               │  RNF-03: Compatibilidad (Android 8.0+ / SDK 26+)       │
               │  RNF-04: Seguridad (Anon Key + RLS en Supabase)        │
               │  RNF-05: Mantenibilidad (TypeScript + Arquitectura Repo)│
               │  RNF-06: Escalabilidad (Preparado para compras y voz)  │
               │  RNF-07: Consistencia de Datos (Transacciones ACID)     │
               └────────────────────────────────────────────────────────┘
```

### RNF-01: Usabilidad y Experiencia de Usuario (UX)
* La interfaz móvil debe ser ergonómica, orientada a una sola mano y de alta legibilidad en pantallas de smartphones convencionales.
* El flujo completo desde el escaneo hasta el cobro no debe superar 4 interacciones del usuario.

### RNF-02: Rendimiento y Tiempo de Respuesta
* Las consultas de búsqueda de productos deben responder en menos de **500 milisegundos** bajo conexiones de red 3G/4G estándar.
* El procesamiento óptico de la cámara para reconocer códigos de barra debe ser en tiempo real (< **200 ms**).

### RNF-03: Compatibilidad y Distribución
* La aplicación debe compilarse para **Android 8.0 (Oreo / API level 26) o superior**.
* Distribución directa en formato standalone `.apk` ejecutable sin requerir suscripción activa en Google Play Store para entornos de prueba y demostración académica.

### RNF-04: Seguridad y Protección de Credenciales
* Las credenciales sensibles no deben estar expuestas en código fuente ni en repositorios públicos Git.
* Uso estricto de variables de entorno (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) y políticas de seguridad a nivel de fila (Row Level Security - RLS) en PostgreSQL.

### RNF-05: Mantenibilidad y Estándares de Código
* Implementación 100% tipada con **TypeScript** y Clean Architecture con separación en Servicios, Repositorios, Hooks y Componentes modulares.

### RNF-06: Escalabilidad y Evolución
* El modelo de datos y los repositorios deben permitir la adición progresiva de futuros módulos: Recepción de Mercadería, Control de Vencimientos, Gastos Operativos y Facturación Electrónica SUNAT.

### RNF-07: Integridad y Consistencia de Datos
* Garantía de consistencia transaccional (ACID): bajo ninguna circunstancia se creará una venta si falla el descuento de inventario, impidiendo descuadres contables o stock negativo.

---

## 4. Criterios de Aceptación (CA)

* **CA-01 (Búsqueda por texto):** Dado un término de búsqueda (ej. *"Paracetamol"* o *"500"*), la aplicación debe listar todos los productos coincidentes mostrando stock disponible y precio unitario.
* **CA-02 (Escaneo de código registrado):** Al escanear una etiqueta PNG (ej. `BOT-000001`), la aplicación debe recuperar automáticamente la información del producto asociado sin requerir digitación manual.
* **CA-03 (Escaneo de código no registrado):** Al escanear un código no registrado en el catálogo, la aplicación debe alertar con el mensaje *"Producto no encontrado en el catálogo"*, permitiendo reintentar el escaneo.
* **CA-04 (Restricción de sobreventa):** La aplicación no debe permitir incrementar la cantidad de un producto por encima de su existencia física actual ($cantidad \le stock$).
* **CA-05 (Actualización de inventario):** Tras confirmar una venta de $N$ unidades de un producto con stock $S$, el nuevo stock en la base de datos debe reflejarse inmediatamente como $S - N$.
* **CA-06 (Persistencia de comprobante):** Toda venta confirmada debe registrarse en la tabla `ventas` con su respectivo código único, total acumulado y fecha UTC.
* **CA-07 (Detalle discriminado):** Cada producto vendido debe quedar registrado en la tabla `detalle_ventas` vinculando `venta_id`, `producto_id`, cantidad, precio unitario y subtotal.
* **CA-08 (Ejecución independiente en APK):** El paquete APK generado mediante EAS Build debe instalarse en cualquier dispositivo Android físico y operar de forma autónoma conectado a internet.
* **CA-09 (Centralización en la Nube):** Todas las lecturas y escrituras realizadas desde el móvil deben sincronizarse en tiempo real con la instancia PostgreSQL en Supabase.
