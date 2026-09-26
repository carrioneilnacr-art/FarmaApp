# 🏥 FarmaApp - Sistema Móvil de Atención y Venta Rápida para Boticas

> **Solución TI para la digitalización y aceleración del proceso de ventas e inventario en tiempo real en pequeñas boticas y farmacias.**

---

## 📌 1. Descripción del Proyecto

**FarmaApp** es una aplicación móvil diseñada específicamente para el personal de atención de boticas y farmacias independientes. Resuelve la lentitud y los errores operativos provocados por la consulta manual de precios en cuadernos y la verificación física en anaqueles, integrando **búsqueda inteligente**, **lectura óptica de códigos de barra por cámara**, **cálculo automatizado de subtotales/totales** y **descuento atómico de stock** en una base de datos centralizada en la nube (**Supabase PostgreSQL**).

---

## 🎯 2. Propuesta de Valor y Proceso de Negocio

```text
Cliente solicita producto
        ↓
Escanear código de barras o buscar por nombre
        ↓
Consulta instantánea de precio y stock en la nube
        ↓
Agregar al carrito y ajustar cantidades (+ / -)
        ↓
Confirmar venta con cálculo automático de total
        ↓
Transacción Atómica (ACID): Registro de venta + Descuento de stock en Supabase
        ↓
Atención completada en menos de 45 segundos
```

---

## 🛠️ 3. Stack Tecnológico

* **Frontend Móvil:** [React Native](https://reactnative.dev/) con [Expo](https://expo.dev/) (TypeScript).
* **Escaneo Óptico:** [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/) con detección en tiempo real de formatos Code 128, EAN-13, EAN-8 y UPC.
* **Backend y Base de Datos:** [Supabase](https://supabase.com/) con [PostgreSQL 15+](https://www.postgresql.org/).
* **Transaccionalidad:** Funciones PL/pgSQL RPC con bloqueo de concurrencia `FOR UPDATE`.
* **Empaquetado y Distribución:** [Expo Application Services (EAS Build)](https://expo.dev/eas) para generación de instaladores directos **Android APK**.

---

## 📁 4. Estructura del Proyecto

```text
app/
├── database/                   # Scripts DDL, Semilla y Funciones RPC
│   ├── schema.sql              # Estructura de tablas e índices
│   ├── rpc.sql                 # Función transaccional registrar_venta_atomica
│   ├── policies.sql            # Políticas de seguridad RLS
│   └── seed.sql                # 25 productos farmacéuticos iniciales
│
├── types/                      # Contratos TypeScript de Base de Datos
│   └── database.ts             # Tipado estricto para entidades y RPC
│
├── test-assets/                # Recursos de prueba óptica
│   └── barcodes/               # 25 códigos de barra PNG (BOT-000001 a BOT-000025)
│       └── README.md           # Tabla de códigos e instrucciones de prueba
│
├── scripts/                    # Scripts de utilidad y automatización
│   └── generate-barcodes.js    # Generador autónomo de códigos Code 128
│
├── docs/                       # Suite completa de documentación técnica
│   ├── requirements.md         # Requerimientos RF, RNF y Criterios de Aceptación
│   ├── process.md              # Diagramas de procesos AS-IS vs. TO-BE (Mermaid)
│   ├── use-cases.md            # Casos de uso CU-01 a CU-04 detallados
│   ├── database.md             # Diccionario de datos y modelo ERD (Mermaid)
│   ├── testing.md              # Plan de pruebas y matriz de verificación
│   ├── deployment.md           # Guía de configuración Supabase y EAS Build APK
│   └── user-manual.md          # Manual de usuario paso a paso para el boticario
│
├── .env.example                # Plantilla de variables de entorno
├── .gitignore                  # Reglas de exclusión de Git
├── eas.json                    # Configuración de compilación Android APK
├── package.json                # Dependencias del proyecto
└── README.md                   # Documento principal del repositorio
```

---

## 🚀 5. Puesta en Marcha Rápida (Quickstart)

### 5.1. Clonar y Configurar Dependencias
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:
```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-publica
```

### 5.2. Configurar la Base de Datos en Supabase
En el **SQL Editor** de tu proyecto Supabase, ejecuta los scripts en el siguiente orden:
1. `database/schema.sql`
2. `database/rpc.sql`
3. `database/policies.sql`
4. `database/seed.sql`

### 5.3. Iniciar la Aplicación en Modo Desarrollo
```bash
npx expo start
```
Escanea el código QR con **Expo Go** en tu smartphone Android.

---

## 🏷️ 6. Pruebas de Códigos de Barra

El proyecto incluye 25 códigos de barra generados en formato PNG de alta resolución listos para proyectar en pantalla o imprimir:

* **Directorio de activos:** [`test-assets/barcodes/`](./test-assets/barcodes/)
* **Guía y Tabla de Productos:** [`test-assets/barcodes/README.md`](./test-assets/barcodes/README.md)
* **Regenerar códigos:** `node scripts/generate-barcodes.js`

---

## 📦 7. Generación de APK para Android (EAS Build)

Para compilar el archivo instalable `.apk` para demostración física:

```bash
# 1. Iniciar sesión en Expo
eas login

# 2. Lanzar compilación de APK en la nube
eas build --platform android --profile preview
```

Consulta la [Guía de Despliegue](./docs/deployment.md) para conocer los pasos detallados de instalación en smartphones.

---

## 📚 8. Índice de Documentación del Proyecto

| Documento | Descripción |
| :--- | :--- |
| 📄 [**Requerimientos de Software**](./docs/requirements.md) | Especificación de RF, RNF y Criterios de Aceptación. |
| 🔄 [**Procesos de Negocio (AS-IS / TO-BE)**](./docs/process.md) | Diagramas de flujo en Mermaid y matriz comparativa de tiempos. |
| 📋 [**Casos de Uso**](./docs/use-cases.md) | Detalle de CU-01 a CU-04 con flujos principales y alternativos. |
| 🗄️ [**Base de Datos y Modelo ERD**](./docs/database.md) | Diccionario de datos, diagrama ERD, políticas RLS y transacciones RPC. |
| 🧪 [**Plan y Matriz de Pruebas**](./docs/testing.md) | Casos de prueba funcionales, de escaneo, carrito y consistencia. |
| 🚀 [**Guía de Despliegue y EAS Build**](./docs/deployment.md) | Paso a paso para Supabase, Expo, compilación de APK y solución de errores. |
| 📖 [**Manual de Usuario**](./docs/user-manual.md) | Guía operativa amigable para el trabajador de la botica. |
