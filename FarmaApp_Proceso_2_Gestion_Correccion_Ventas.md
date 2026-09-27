# FarmaApp — Proceso 2: Gestión y Corrección de Ventas

## 1. Información general

- **Proyecto:** FarmaApp
- **Establecimiento:** Botica San Francisco
- **Plataforma:** Android
- **Stack:** React Native + Expo + TypeScript + Supabase PostgreSQL
- **Entrega:** Segunda entrega
- **Proceso:** Gestión y corrección de ventas

## 2. Objetivo

Implementar un proceso que permita al cajero **consultar, gestionar y corregir operaciones de venta después de registrarlas**, manteniendo trazabilidad y evitando eliminar físicamente información.

Casos reales:

- El cliente quiere agregar otro producto después de cerrar la venta.
- El cliente quiere devolver un producto.
- El cajero detecta un error.
- Se necesita consultar una venta anterior.
- Se necesita identificar ventas anuladas.
- El dueño necesita conocer incidencias.

## 3. Problema de negocio

En una botica pequeña, después de una venta pueden ocurrir situaciones difíciles de resolver manualmente. Por ejemplo:

1. El cliente compra dos productos.
2. El cajero cobra y registra la venta.
3. Se genera el comprobante.
4. El cliente recuerda que necesita otro producto.
5. La venta original ya está cerrada y no debe simplemente editarse o borrarse.

El problema es la **falta de trazabilidad y control posterior a la venta**.

## 4. Solución

FarmaApp incorporará **Gestión de ventas**, permitiendo:

- Consultar ventas recientes.
- Buscar una venta.
- Ver su detalle.
- Identificar su estado.
- Gestionar incidencias.
- Registrar devoluciones.
- Iniciar procesos de anulación/corrección.
- Mantener historial.
- Controlar los movimientos de stock relacionados.

## 5. Relación con la Entrega 1

### Entrega 1 — Atención y venta

```text
Cliente solicita producto
        ↓
Buscar / escanear
        ↓
Consultar producto
        ↓
Agregar a venta
        ↓
Confirmar
        ↓
Registrar venta
        ↓
Actualizar stock
```

### Entrega 2 — Gestión posterior

```text
Venta registrada
        ↓
Consultar venta
        ↓
Gestionar operación posterior
        ↓
┌──────────────┬──────────────┬──────────────┐
│              │              │
Agregar       Devolución     Anulación /
producto      producto       corrección
│              │              │
└──────────────┴──────────────┴──────────────┘
        ↓
Actualizar estados
        ↓
Actualizar stock cuando corresponda
        ↓
Mantener trazabilidad
```

## 6. Alcance

### Incluido

- Listar ventas recientes.
- Buscar ventas.
- Ver detalle.
- Mostrar fecha, productos, cantidades, precios y total.
- Mostrar estado.
- Cancelar ventas abiertas.
- Registrar incidencias.
- Gestionar devoluciones.
- Gestionar anulación/corrección.
- Mantener historial.
- Mostrar resumen básico de incidencias.

### Fuera de alcance

No implementar todavía:

- Proveedores.
- Compras.
- Recepción de mercadería.
- Gastos.
- Roles avanzados.
- Dashboard empresarial completo.
- IA.
- Asistente por voz.
- Predicción de demanda.
- Integración completa con SUNAT.
- OSE/PSE real.
- Yape/Plin real.
- Pasarela de pagos.
- Contabilidad.

## 7. Regla fundamental: no borrar ventas

Una venta realizada **NO debe eliminarse físicamente**.

Incorrecto:

```sql
DELETE FROM ventas WHERE id = 25;
```

Correcto:

```text
Venta #25
Estado: ANULADA
```

La información debe conservarse para auditoría, trazabilidad, control e integridad de stock.

## 8. Estados de una venta

Inicialmente:

```text
ABIERTA
PAGADA
EMITIDA
ANULADA
DEVUELTA
```

### ABIERTA

La venta se está construyendo y puede modificarse o cancelarse.

### PAGADA

El cliente ya realizó el pago. La venta queda cerrada para modificaciones normales.

### EMITIDA

Existe un comprobante asociado. No debe modificarse directamente.

### ANULADA

La operación fue anulada, pero permanece registrada.

### DEVUELTA

La venta o parte de ella tuvo una devolución.

## 9. Caso principal: cliente quiere agregar otro producto

Ejemplo:

```text
Venta #000125
Paracetamol 500 mg x2
Alcohol 250 ml x1
Total: S/ 10.50
Estado: EMITIDA
```

El cliente dice:

> También quiero un termómetro.

El cajero:

```text
Ventas
 ↓
Busca #000125
 ↓
Gestionar venta
```

La aplicación muestra:

```text
Esta venta ya fue emitida.

No es posible modificar directamente
el comprobante original.
```

La aplicación ofrece el flujo correspondiente.

Si posteriormente existe integración tributaria:

```text
Gestionar comprobante
        ↓
Proceso de anulación/corrección
        ↓
Nueva operación relacionada
```

La venta original debe conservarse.

## 10. Comprobante emitido

Una boleta emitida **no debe tratarse como un registro editable común**.

Si el proyecto todavía no tiene integración real con SUNAT/OSE/PSE:

- Se puede simular el flujo de anulación/corrección.
- Debe indicarse claramente que es una simulación.
- No afirmar que se está anulando un comprobante real ante SUNAT.

La integración tributaria real queda para una futura entrega.

## 11. Venta abierta

Si la venta todavía está ABIERTA:

```text
Venta abierta
      ↓
Cancelar venta
      ↓
Confirmación
      ↓
Venta cancelada
```

No existe todavía un comprobante emitido.

## 12. Devolución

Ejemplo:

```text
Venta #000120

Paracetamol x2
Alcohol x1
```

El cliente devuelve:

```text
Alcohol x1
```

Flujo:

```text
Buscar venta
 ↓
Seleccionar producto
 ↓
Indicar cantidad
 ↓
Indicar motivo
 ↓
Confirmar
 ↓
Registrar devolución
 ↓
Actualizar stock
```

La venta original permanece.

## 13. Regla de stock

### Venta

```text
Venta confirmada
        ↓
Stock - cantidad vendida
```

### Devolución válida

```text
Devolución registrada
        ↓
Stock + cantidad devuelta
```

### Anulación

La reversión del stock dependerá del estado de la operación.

Nunca modificar stock manualmente sin registrar el movimiento correspondiente.

## 14. Módulo Ventas

Vista propuesta:

```text
VENTAS

Buscar venta...

HOY

#000128   S/ 32.50
Hace 2 min    EMITIDA

#000127   S/ 18.50
Hace 8 min    EMITIDA

#000126   S/ 45.00
Hace 15 min   ANULADA
```

## 15. Detalle de venta

```text
VENTA #000128

27/09/2026 — 15:42

Paracetamol 500 mg
2 × S/ 3.00       S/ 6.00

Alcohol 250 ml
1 × S/ 4.50       S/ 4.50

Termómetro
1 × S/ 22.00      S/ 22.00

────────────────────
TOTAL             S/ 32.50

Estado: EMITIDA

[ Gestionar venta ]
```

## 16. Gestionar venta

### ABIERTA

```text
Editar venta
Cancelar venta
```

### PAGADA

```text
Ver detalle
Gestionar comprobante
```

### EMITIDA

```text
Ver comprobante
Gestionar comprobante
Registrar incidencia
```

### ANULADA

```text
Ver detalle
Ver motivo
Ver historial
```

### DEVUELTA

```text
Ver detalle
Ver devolución
Ver historial
```

## 17. Historial

Cada venta debe poder mostrar:

```text
HISTORIAL

15:42
Venta creada

15:43
Pago registrado

15:43
Comprobante generado

15:51
Solicitud de gestión registrada

15:52
Operación relacionada creada
```

## 18. Base de datos

### ventas

Mantener/agregar:

```text
id
numero_venta
fecha
subtotal
total
estado
comprobante_tipo
comprobante_serie
comprobante_numero
venta_origen_id
created_at
updated_at
```

`venta_origen_id` permite relacionar operaciones.

Ejemplo:

```text
Venta original #000125
        ↓
Operación relacionada #000126
```

### detalle_ventas

```text
id
venta_id
producto_id
cantidad
precio_unitario
subtotal
created_at
```

### devoluciones

Crear:

```text
id
venta_id
fecha
motivo
estado
total_devuelto
created_at
```

### detalle_devoluciones

```text
id
devolucion_id
producto_id
cantidad
precio_unitario
subtotal
created_at
```

### incidencias_ventas

Crear:

```text
id
venta_id
tipo
descripcion
estado
created_at
updated_at
```

Tipos:

```text
ANULACION
DEVOLUCION
CORRECCION
AGREGAR_PRODUCTO
OTRO
```

Estados:

```text
PENDIENTE
PROCESADA
CANCELADA
```

### movimientos_stock

Recomendado:

```text
id
producto_id
tipo
cantidad
stock_anterior
stock_nuevo
referencia_tipo
referencia_id
created_at
```

Tipos:

```text
VENTA
DEVOLUCION
ANULACION
AJUSTE
```

Esto permite saber por qué cambió el stock.

## 19. Integridad de operaciones

Las operaciones críticas deben ser transaccionales cuando sea posible.

Conceptualmente:

```text
registrar_venta()
        ↓
validar stock
        ↓
crear venta
        ↓
crear detalles
        ↓
actualizar stock
        ↓
crear movimiento_stock
        ↓
confirmar
```

Si falla una parte:

```text
ROLLBACK
```

No debe quedar una venta registrada con stock incorrecto.

Para Supabase/PostgreSQL se recomienda utilizar funciones RPC para operaciones críticas.

## 20. Búsqueda

Prioridad inicial:

- Número de venta.
- Número de comprobante.

Posteriormente:

- Fecha.
- Producto.
- Estado.

## 21. Resumen para el dueño

Agregar una vista sencilla:

```text
RESUMEN DEL DÍA

Ventas realizadas
38

Total vendido
S/ 846.50

Ventas anuladas
2

Devoluciones
1

Productos vendidos
67
```

No crear todavía un dashboard complejo.

## 22. Indicadores

Preparar la estructura para medir:

```text
Total vendido
Cantidad de ventas
Ventas anuladas
Devoluciones
Productos vendidos
Productos devueltos
```

## 23. UX/UI

Mantener el lenguaje visual de la Entrega 1:

- Mobile-first.
- 360–430 px.
- Referencia 390 × 844.
- Uso con una mano.
- Botones grandes.
- Información clara.
- Estados diferenciados.
- Confirmación antes de acciones críticas.
- Sin exceso de animaciones.

Evitar:

- Gradientes fuertes.
- Neón.
- Glassmorphism.
- Estética futurista.
- Dashboard genérico.
- Tarjetas excesivas.
- Sombras pesadas.
- Emojis como elementos principales.

## 24. Acciones críticas

### Anulación

```text
¿Deseas gestionar la anulación de esta operación?

La venta no será eliminada.
Se conservará el historial.

[ Volver ]
[ Continuar ]
```

### Devolución

```text
¿Confirmar devolución?

Producto:
Alcohol 250 ml

Cantidad:
1

Stock actual:
15

Stock después:
16

[ Cancelar ]
[ Confirmar devolución ]
```

## 25. Errores

### Venta no encontrada

```text
No encontramos una venta con ese número.
```

### Venta ya anulada

```text
Esta venta ya se encuentra anulada.
```

### Devolución inválida

```text
La cantidad a devolver supera la cantidad vendida.
```

### Conexión

```text
No se pudo conectar con el servidor.
Verifica tu conexión e inténtalo nuevamente.
```

### Operación

```text
No se pudo completar la operación.
No se realizaron cambios en la venta ni en el stock.
```

## 26. Seguridad

- No exponer claves privadas.
- Usar variables de entorno.
- Aplicar RLS en Supabase.
- Validar operaciones en PostgreSQL.
- No confiar únicamente en el frontend.
- Nunca incluir `SUPABASE_SERVICE_ROLE_KEY` en el APK.

## 27. Requisitos funcionales

- **RF-01:** listar ventas recientes.
- **RF-02:** buscar una venta.
- **RF-03:** mostrar detalle.
- **RF-04:** mostrar estado.
- **RF-05:** cancelar venta abierta.
- **RF-06:** impedir edición directa de venta con comprobante emitido.
- **RF-07:** registrar incidencias.
- **RF-08:** registrar devoluciones.
- **RF-09:** actualizar stock cuando corresponda.
- **RF-10:** conservar historial.
- **RF-11:** no eliminar ventas históricas.
- **RF-12:** registrar movimientos de stock.
- **RF-13:** mostrar resumen básico.

## 28. Requisitos no funcionales

- **RNF-01:** consultas rápidas bajo la carga esperada.
- **RNF-02:** integridad transaccional.
- **RNF-03:** uso sencillo para un cajero.
- **RNF-04:** trazabilidad.
- **RNF-05:** seguridad de credenciales.
- **RNF-06:** código mantenible y separado por responsabilidades.

## 29. Casos de uso

### CU-01 — Consultar venta

```text
Ventas
 ↓
Buscar
 ↓
Seleccionar
 ↓
Ver detalle
```

### CU-02 — Cancelar venta abierta

```text
Venta abierta
 ↓
Cancelar
 ↓
Confirmar
 ↓
Cambiar estado
```

### CU-03 — Registrar devolución

```text
Buscar venta
 ↓
Seleccionar producto
 ↓
Cantidad
 ↓
Motivo
 ↓
Confirmar
 ↓
Registrar devolución
 ↓
Actualizar stock
```

### CU-04 — Gestionar venta emitida

```text
Buscar venta
 ↓
Detalle
 ↓
Gestionar comprobante
 ↓
Seleccionar operación
 ↓
Registrar incidencia
```

## 30. Arquitectura

Mantener:

```text
React Native / Expo
        ↓
Supabase Client
        ↓
HTTPS
        ↓
Supabase PostgreSQL
```

Estructura sugerida:

```text
src/
├── components/
│   ├── sales/
│   ├── products/
│   └── common/
├── screens/
│   ├── sales/
│   │   ├── SalesListScreen.tsx
│   │   ├── SaleDetailScreen.tsx
│   │   ├── ManageSaleScreen.tsx
│   │   └── ReturnSaleScreen.tsx
│   └── products/
├── services/
│   ├── salesService.ts
│   ├── returnsService.ts
│   └── stockService.ts
├── types/
│   ├── sale.ts
│   ├── return.ts
│   └── stock.ts
├── hooks/
│   ├── useSales.ts
│   └── useSale.ts
└── lib/
    └── supabase.ts
```

## 31. Criterios de aceptación

- [ ] El cajero puede visualizar ventas recientes.
- [ ] Puede buscar una venta.
- [ ] Puede abrir el detalle.
- [ ] Puede identificar el estado.
- [ ] Puede cancelar una venta abierta.
- [ ] Puede registrar una incidencia.
- [ ] Puede registrar una devolución.
- [ ] El stock se actualiza correctamente cuando corresponde.
- [ ] Una venta histórica no se elimina.
- [ ] Las operaciones críticas quedan registradas.
- [ ] El historial puede consultarse.
- [ ] Se muestran errores claros.
- [ ] Venta y stock permanecen consistentes.
- [ ] La app funciona en Android.
- [ ] Los datos permanecen en Supabase.

## 32. Demo de exposición

Escenario:

1. Cliente compra Paracetamol x2 + Alcohol x1.
2. Se registra la venta.
3. Se genera el comprobante simulado.
4. Cliente dice: “También quiero un termómetro”.
5. Cajero busca la venta.
6. FarmaApp detecta que ya fue emitida.
7. La app impide editar directamente la venta.
8. Se muestra el flujo de gestión de comprobante.
9. Se registra una incidencia.
10. Se demuestra una devolución.
11. Se observa el cambio de stock.
12. Se consulta el historial.

Cierre de la demo:

```text
38 ventas
S/ 846.50
2 anuladas
1 devolución
```

## 33. El "WOW" de FarmaApp

No presentar la entrega como:

> “Agregamos una pantalla de ventas.”

Presentarla como:

> **“FarmaApp no solo registra una venta; permite gestionar lo que sucede después de ella sin perder la trazabilidad de la operación ni descontrolar el inventario.”**

El sistema ayuda al cajero a resolver incidencias rápidamente y al dueño a mantener control sobre las operaciones.

## 34. Roadmap

### Entrega 1 — Atención y venta

```text
Buscar
Escanear
Consultar
Agregar
Vender
Actualizar stock
```

### Entrega 2 — Gestión y corrección

```text
Consultar ventas
Gestionar venta
Devoluciones
Anulaciones/correcciones
Historial
Movimientos de stock
```

### Entrega 3 — Inventario

```text
Stock mínimo
Movimientos
Ajustes
Alertas
Inventario general
```

### Entrega 4 — Compras y reposición

```text
Proveedores
Órdenes de compra
Recepción
Ingreso de productos
Reposición
```

### Entrega 5 — Control del negocio

```text
Dashboard
Ventas
Productos más vendidos
Stock crítico
Devoluciones
Anulaciones
Indicadores
```

## 35. Prompt para el agente de desarrollo

Actúa como un **Senior Software Engineer especializado en React Native, Expo, TypeScript, Supabase y PostgreSQL**.

Implementa el **Proceso 2 de FarmaApp: Gestión y Corrección de Ventas**, integrándolo con la Entrega 1 existente.

Antes de programar:

1. Inspecciona la estructura actual.
2. No destruyas funcionalidades existentes.
3. Reutiliza componentes.
4. Analiza navegación, servicios, tablas y RLS.
5. Analiza cómo la Entrega 1 registra ventas y actualiza stock.
6. Propón cambios mínimos necesarios.

Reglas:

- Mantener TypeScript.
- Mantener el diseño actual.
- Validar frontend y base de datos.
- No borrar ventas históricas.
- Implementar estados.
- Mantener trazabilidad.
- Mantener consistencia del stock.
- Usar RPC/transacciones para operaciones críticas cuando corresponda.
- No exponer claves privadas.
- No implementar SUNAT real si no existe integración configurada.
- Si el comprobante es simulado, identificarlo como simulación.
- No implementar módulos fuera del alcance.
- Integrar la funcionalidad al sistema real, no crear un prototipo aislado.

Entregar:

- Código funcional.
- Migraciones SQL.
- Pantallas.
- Componentes.
- Servicios.
- Tipos.
- RPC necesarias.
- RLS.
- Datos de prueba.
- Pruebas.
- README actualizado.

## 36. Definition of Done

```text
[✓] Proceso 1 sigue funcionando
[✓] Ventas consultables
[✓] Venta buscable
[✓] Detalle visible
[✓] Estados implementados
[✓] Venta abierta cancelable
[✓] Venta histórica no eliminable
[✓] Incidencias registrables
[✓] Devoluciones funcionales
[✓] Stock consistente
[✓] Historial disponible
[✓] Errores controlados
[✓] RLS configurado
[✓] Datos de prueba
[✓] Android probado
[✓] README actualizado
```

## 37. Nota académica

Diferenciar en la exposición entre:

**Funcionalidad implementada:** gestión interna de ventas, estados, incidencias, devoluciones, stock y trazabilidad.

**Funcionalidad simulada:** anulación/corrección de comprobantes electrónicos cuando todavía no exista integración real con SUNAT/OSE/PSE.

Esto evita presentar como real una integración tributaria que todavía no está implementada.
