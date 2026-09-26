# FarmaApp - Guía de Configuración, Despliegue y Generación de APK Android

Esta guía detalla paso a paso el procedimiento técnico para configurar el backend en **Supabase**, ejecutar la aplicación móvil en entorno de desarrollo con **Expo**, compilar el instalador **Android APK** mediante **EAS Build** e instalarlo en dispositivos móviles físicos.

---

## 1. Requisitos Previos

* **Node.js:** Versión 18.x o 20.x+ LTS instalada ([nodejs.org](https://nodejs.org)).
* **Gestor de paquetes:** `npm` (incluido con Node.js) o `yarn`.
* **Cuenta en Supabase:** Cuenta gratuita o pro en [supabase.com](https://supabase.com).
* **Cuenta en Expo:** Cuenta gratuita en [expo.dev](https://expo.dev).
* **Smartphone Android:** Android 8.0 (API 26) o superior con cámara funcional.
* **EAS CLI:** Herramienta oficial de compilación en la nube de Expo.

```bash
npm install -g eas-cli
```

---

## 2. Configuración del Backend en Supabase

### 2.1. Creación del Proyecto
1. Ingresa a tu panel de control en [Supabase Dashboard](https://supabase.com/dashboard).
2. Haz clic en **"New Project"**, asigna un nombre (ej. `farma-app-db`) y define una contraseña segura para la base de datos.
3. Selecciona la región más cercana (ej. `South America (São Paulo)`).

### 2.2. Ejecución de Scripts SQL (Esquema y Semilla)
Dirígete a la sección **SQL Editor** en el panel de Supabase y ejecuta los archivos ubicados en la carpeta `database/` en el siguiente orden:

1. **`database/schema.sql`:** Crea las tablas `categorias`, `productos`, `ventas` y `detalle_ventas`, junto con los índices de rendimiento y triggers.
2. **`database/rpc.sql`:** Registra la función PL/pgSQL `registrar_venta_atomica` para el cobro transaccional seguro con bloqueo `FOR UPDATE`.
3. **`database/policies.sql`:** Aplica las políticas de seguridad Row Level Security (RLS) para lectura pública y mutaciones controladas.
4. **`database/seed.sql`:** Inserta las 5 categorías terapéuticas y los 25 productos farmacéuticos iniciales (`BOT-000001` a `BOT-000025`).

### 2.3. Obtención de Credenciales de API
En el menú lateral de Supabase:
1. Ve a **Project Settings** > **API**.
2. Copia la **Project URL** (ej. `https://xyzcompany.supabase.co`).
3. Copia la clave **anon / public** (clave pública segura para clientes móviles).

---

## 3. Configuración del Entorno Móvil

1. En la raíz del proyecto `app/`, crea un archivo `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

2. Completa los valores con tus credenciales de Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_APP_ENV=preview
```

---

## 4. Ejecución en Modo Desarrollo (Expo Go / Emulador)

Para iniciar el servidor de desarrollo Metro y probar la aplicación en tiempo real:

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor Expo
npx expo start
```

* **En Teléfono Físico:** Escanea el código QR generado en la terminal utilizando la app **Expo Go** (Android).
* **En Emulador Android:** Presiona la tecla `a` en la terminal con Android Studio abierto.

---

## 5. Compilación del Paquete Android APK con EAS Build

Para generar un archivo instalable autónomo (`.apk`) que pueda instalarse directamente en cualquier smartphone Android sin depender de Expo Go ni de computadoras auxiliares:

### 5.1. Autenticación en EAS
```bash
eas login
```
Ingresa tu usuario y contraseña de Expo.

### 5.2. Vincular el Proyecto
```bash
eas project:init
```

### 5.3. Verificar la Configuración de `eas.json`
El proyecto incluye un archivo `eas.json` optimizado con el perfil `preview` configurado para generar un archivo APK directo:

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "env": {
        "NODE_ENV": "production"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### 5.4. Lanzar la Compilación en la Nube (Cloud Build)
Ejecuta el siguiente comando en la terminal:

```bash
eas build --platform android --profile preview
```

1. EAS te preguntará si deseas generar un Android Keystore automáticamente; selecciona **Yes (generar automáticamente)**.
2. La compilación se ejecutará en los servidores de Expo en la nube (toma entre 5 y 10 minutos).
3. Al finalizar, la terminal te proporcionará un **enlace directo de descarga** y un código QR para descargar el archivo `FarmaApp.apk`.

### 5.5. Alternativa: Compilación Local (Requiere Android Studio y Java SDK)
Si dispones de Android Studio, SDK de Android y Java 17 configurados en tu máquina:

```bash
npx eas build --platform android --profile preview --local
```

---

## 6. Instalación del APK en el Dispositivo Móvil

```text
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│ 1. Descargar APK       │      │ 2. Permitir Origen     │      │ 3. Instalar & Abrir    │
│ Desde enlace EAS o USB │ ───► │ Habilitar instalación  │ ───► │ Otorgar permiso cámara │
│ en smartphone Android  │      │ de apps desconocidas   │      │ y comenzar a vender    │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

1. **Descarga:** Abre el enlace generado por EAS en el navegador de tu teléfono móvil o transfiere el archivo `.apk` mediante cable USB.
2. **Permisos de Instalación:** Si Android muestra la advertencia *"Por seguridad, tu teléfono no tiene permitido instalar apps desconocidas de esta fuente"*, pulsa en **Configuración** y activa **"Confiar en esta fuente"**.
3. **Instalación:** Presiona **Instalar**.
4. **Primer Inicio:** Abre la app **FarmaApp**. Cuando solicite acceso a la cámara para el escaneo de códigos de barra, presiona **"Permitir mientras la app está en uso"**.

---

## 7. Solución de Problemas Frecuentes (Troubleshooting)

| Síntoma / Error | Causa Probable | Solución |
| :--- | :--- | :--- |
| **Error de conexión con Supabase** | Variables `EXPO_PUBLIC_SUPABASE_URL` o `ANON_KEY` mal copiadas en `.env` | Verifica que no existan espacios en blanco al inicio o final de las claves en el `.env` y reinicia el servidor. |
| **Cámara en negro / sin imagen** | Permiso de cámara no concedido en Android | Ingresa a *Ajustes de Android > Aplicaciones > FarmaApp > Permisos > Cámara* y selecciona *Permitir*. |
| **EAS Build falla por Keystore** | Conflicto de firmas previas en Expo | Ejecuta `eas credentials` y selecciona la opción de regenerar Keystore para Android. |
| **El código de barras no se lee** | Brillo de pantalla muy alto o reflejo | Ajusta el brillo del monitor o imprime el código [`BOT-000001.png`](../test-assets/barcodes/BOT-000001.png) en papel. |
