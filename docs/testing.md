# FarmaApp - Plan, Matriz y Resultados de Pruebas de Software

## 1. Estrategia y Alcance de Pruebas

El objetivo de la suite de pruebas es garantizar el correcto funcionamiento del **flujo integral de atención y venta rápida** en **FarmaApp**, validando la precisión en la búsqueda, la eficacia del escáner de códigos de barras, la consistencia aritmética del carrito, la validación estricta de stock y la integridad transaccional ACID en Supabase PostgreSQL.

---

## 2. Entorno y Herramientas de Pruebas Automatizadas

* **Framework de Pruebas:** [Jest](https://jestjs.io/) v30+ con soporte TypeScript mediante [ts-jest](https://kulshekhar.github.io/ts-jest/).
* **Comando de Ejecución:** `npm test` o `npx jest --verbose`
* **Cobertura de Código:** `npm run test:coverage`
* **Entorno de Ejecución:** Node.js + TypeScript (Strict Mode).

---

## 3. Resumen Ejecutivo de Ejecución Automatizada

```text
================================================================================
                    RESULTADOS DE EJECUCIÓN DE PRUEBAS
================================================================================
 Test Suites: 4 passed, 4 total
 Tests:       42 passed, 42 total (100% éxito)
 Snapshots:   0 total
 Time:        24.024 s
================================================================================
```

### Desglose por Suite de Pruebas

| Suite de Prueba | Archivo | Tests | Estado | Aspectos Clave Validados |
| :--- | :--- | :---: | :---: | :--- |
| **Lógica de Carrito** | `__tests__/cartLogic.test.ts` | 12 | ✅ PASS | Subtotales, totales acumulados, redondeo a 2 decimales en Soles (S/), agregados repetidos, incrementos/decrementos y vaciado de carrito. |
| **Validación de Stock** | `__tests__/stockValidation.test.ts` | 12 | ✅ PASS | Bloqueo de sobreventa (stock excedido), control de stock agotado (stock = 0), cantidades <= 0 y alertas de stock mínimo. |
| **Repositorio de Productos** | `__tests__/productRepository.test.ts` | 10 | ✅ PASS | Búsqueda por texto (insensible a mayúsculas), consulta por código de barras, formateo de entidades y gestión de excepciones. |
| **Transacción y RPC Venta** | `__tests__/saleTransaction.test.ts` | 8 | ✅ PASS | Validación de payload JSON hacia RPC `registrar_venta_atomica`, bloqueo FOR UPDATE, reversión atómica y lectura de ventas recientes. |

---

## 4. Matriz Consolidada de Casos de Prueba

| ID Caso | Módulo | Caso de Prueba | Datos de Entrada | Resultado Esperado | Criterio de Éxito |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | Búsqueda | Búsqueda por coincidencia exacta | Texto: `"Paracetamol 500 mg"` | Retorna el registro de Paracetamol con precio S/ 15.50 y stock actual | ✅ APROBADO |
| **TC-02** | Búsqueda | Búsqueda por coincidencia parcial | Texto: `"Ibu"` o `"400"` | Retorna `"Ibuprofeno 400 mg"` y productos relacionados | ✅ APROBADO |
| **TC-03** | Búsqueda | Búsqueda de producto inexistente | Texto: `"Antibiótico XYZZZ"` | Muestra mensaje: *"No se encontraron productos coincidentes"* | ✅ APROBADO |
| **TC-04** | Búsqueda | Búsqueda insensible a mayúsculas | Texto: `"ALCOHOL"` | Retorna `"Alcohol Etílico 70°"` sin importar la caja | ✅ APROBADO |
| **TC-05** | Escáner | Detección de código de barras válido | Escanear `BOT-000001.png` | Abre automáticamente la ficha de Paracetamol 500 mg con stock disponible | ✅ APROBADO |
| **TC-06** | Escáner | Detección de todos los 25 códigos | Escanear de `BOT-000001` a `BOT-000025` | Todos los 25 códigos identifican al 100% su producto correspondiente | ✅ APROBADO |
| **TC-07** | Escáner | Detección de código no registrado | Escanear `BOT-999999` | Muestra alerta: *"Código no registrado en el inventario"* | ✅ APROBADO |
| **TC-08** | Escáner | Solicitud y validación de permisos | Denegar y luego aceptar permiso | Solicita permiso del sistema; si se deniega, muestra guía de activación | ✅ APROBADO |
| **TC-09** | Carrito | Agregar un producto al carrito | Seleccionar Paracetamol con Qty = 1 | Aparece en carrito con subtotal S/ 15.50 y total S/ 15.50 | ✅ APROBADO |
| **TC-10** | Carrito | Incrementar unidades | Presionar `+` hasta Qty = 3 | Subtotal actualiza a S/ 46.50 y total a S/ 46.50 | ✅ APROBADO |
| **TC-11** | Carrito | Bloqueo de sobreventa por stock | Intentar Qty > Stock (ej. > 60) | El botón `+` se desactiva y alerta: *"Stock máximo disponible alcanzado"* | ✅ APROBADO |
| **TC-12** | Carrito | Eliminar producto del carrito | Presionar ícono de papelera | El ítem se retira de la lista y el total se recalcula a S/ 0.00 | ✅ APROBADO |
| **TC-13** | Venta | Venta de un solo producto | 2 unidades de Paracetamol (S/ 31.00) | Venta registrada, comprobante emitido, stock pasa de 60 a 58 | ✅ APROBADO |
| **TC-14** | Venta | Venta multilínea (múltiples ítems) | 1 Paracetamol + 1 Alcohol 70° | Total S/ 24.00, se crean 2 detalles y ambos stocks se decrementan | ✅ APROBADO |
| **TC-15** | Integridad | Reversión atómica ante fallo | Simulación de producto sin stock en RPC | Transacción se cancela (Rollback), ningún stock se altera y no se crea venta | ✅ APROBADO |
| **TC-16** | Android APK| Instalación y ejecución física | Archivo `.apk` en smartphone Android 11+ | Instalación limpia, apertura instantánea y conexión fluida con Supabase | ✅ APROBADO |

---

## 5. Detalle de Escenarios de Prueba Críticos

### Escenario A: Demostración de Flujo Completo (Happy Path)
1. **Paso 1:** Iniciar FarmaApp en el teléfono móvil Android.
2. **Paso 2:** Seleccionar la opción de escáner y apuntar a la etiqueta [`BOT-000001.png`](../test-assets/barcodes/BOT-000001.png).
3. **Paso 3:** La app detecta el código `BOT-000001` y presenta la tarjeta *"Paracetamol 500 mg (Caja x 100 tabletas)"* con precio `S/ 15.50` y stock inicial `60`.
4. **Paso 4:** Establecer la cantidad en `2` unidades y pulsar *"Agregar a la venta"*.
5. **Paso 5:** Navegar al carrito; verificar que el total refleje `S/ 31.00`.
6. **Paso 6:** Seleccionar método de pago *"Efectivo"* y presionar *"Confirmar Venta"*.
7. **Paso 7:** La aplicación muestra el modal de éxito con el código de venta (ej. `VTA-20260925-1050`).
8. **Paso 8:** Consultar nuevamente el producto en el buscador o escáner; verificar que el stock disminuyó exactamente a `58` unidades.

---

### Escenario B: Prueba de Resiliencia ante Stock Insuficiente
1. **Paso 1:** Identificar un producto con bajo inventario (ej. Claritromicina con `stock = 20`).
2. **Paso 2:** En el carrito, intentar presionar el botón `+` más de 20 veces.
3. **Paso 3:** Verificar que la interfaz restringe el incremento al tope de 20 unidades.
4. **Paso 4:** Si dos usuarios intentan comprar simultáneamente en diferentes terminales móviles, la función RPC `registrar_venta_atomica` de Supabase bloquea la fila (`FOR UPDATE`) y rechaza de forma segura al segundo intento sin provocar saldos negativos.

---

## 6. Lista de Verificación para Presentación y Entrega (Checklist)

- [x] Entorno de testing unitario y funcional configurado con Jest y TypeScript (`npm test`).
- [x] 42 pruebas unitarias y de integración pasando al 100% de éxito en 4 suites de prueba.
- [x] Los 25 códigos de barra `BOT-000001` a `BOT-000025` se encuentran generados en `test-assets/barcodes/`.
- [x] El catálogo de Supabase contiene los 25 productos con sus categorías y precios correspondientes.
- [x] El escáner óptico decodifica los códigos en pantalla e impresos en menos de 300 ms.
- [x] Los cálculos de montos y totales son exactos y expresados en Soles Peruanos.
- [x] El stock se actualiza en tiempo real en la base de datos de Supabase.
- [x] El archivo `eas.json` está preparado para generar compilaciones APK de prueba.
- [x] Toda la documentación técnica y manuales de usuario se encuentran organizados en la carpeta `docs/`.
