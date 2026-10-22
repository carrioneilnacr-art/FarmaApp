# FarmaApp --- Procesos, Inventario Inteligente y Asistente IA

> Documento maestro de diseño funcional y viabilidad.
>
> **Objetivo:** definir de forma clara los procesos que FarmaApp
> incorporará para la gestión y corrección de ventas, trazabilidad,
> inventario, alertas y asistencia mediante inteligencia artificial.
>
> Este documento forma parte de la documentación del proyecto. La
> sección de costos y rentabilidad es una referencia de viabilidad y
> **no corresponde a una pantalla o módulo visible de FarmaApp**.

------------------------------------------------------------------------

## 1. Visión general

FarmaApp busca apoyar la operación de una farmacia local mediante
procesos reales y factibles. La aplicación no se limita a registrar
productos y ventas: debe conservar trazabilidad, controlar inventario,
detectar situaciones que requieren atención y facilitar la consulta de
información.

Los procesos principales quedan organizados así:

1.  **Atención y venta.**
2.  **Gestión, corrección y devolución de ventas.**
3.  **Gestión de inventario, lotes y vencimientos.**
4.  **Alertas y reposición de stock.**
5.  **Asistente inteligente de consulta y trazabilidad.**
6.  **Documentación de viabilidad y costo de IA.**

------------------------------------------------------------------------

# 2. Proceso 1 --- Atención y venta

## 2.1 Objetivo

Registrar correctamente una venta, validar la disponibilidad de los
productos y actualizar el inventario de forma consistente.

## 2.2 Flujo general

``` text
Cliente solicita productos
        ↓
Trabajador busca o escanea productos
        ↓
Sistema consulta precio y disponibilidad
        ↓
Productos se agregan a la venta
        ↓
Se valida stock
        ↓
Se confirma la venta
        ↓
Se registra la operación
        ↓
Se descuenta el inventario
        ↓
Se genera el comprobante correspondiente
```

## 2.3 Datos que deben conservarse

-   Identificador de venta.
-   Fecha y hora.
-   Usuario que atendió.
-   Productos.
-   Cantidades.
-   Precio unitario.
-   Subtotal y total.
-   Estado de la venta.
-   Movimientos de inventario generados.
-   Información necesaria para relacionar el comprobante con la
    operación.

------------------------------------------------------------------------

# 3. Proceso 2 --- Gestión, corrección y devolución de ventas

## 3.1 Objetivo

Permitir solucionar errores o cambios solicitados por el cliente sin
destruir el historial de la operación.

La regla principal es:

> **Una corrección nunca debe borrar la historia de lo ocurrido.**

FarmaApp debe poder reconstruir la venta original, la modificación
realizada, el usuario responsable, el motivo y el efecto sobre el
inventario.

------------------------------------------------------------------------

## 3.2 Escenario A --- El cliente compra tres productos y quiere retirar uno

Ejemplo:

``` text
Venta original:
- Producto A
- Producto B
- Producto C

Cliente indica:
"Ya no quiero el Producto B."
```

### Flujo

1.  El trabajador localiza la venta.
2.  FarmaApp muestra el detalle.
3.  El trabajador selecciona `Producto B`.
4.  Selecciona la opción de corrección/devolución.
5.  Registra un motivo.
6.  El sistema registra qué producto fue retirado.
7.  Se restaura al inventario la cantidad correspondiente cuando
    proceda.
8.  Se recalculan los importes de la operación corregida.
9.  Se registra quién realizó el cambio y cuándo.
10. La operación original permanece disponible en el historial.

### Trazabilidad esperada

``` text
Venta #00125 creada
        ↓
Cliente solicita corrección
        ↓
Producto B retirado
        ↓
Motivo registrado
        ↓
Stock de Producto B restaurado
        ↓
Operación corregida registrada
        ↓
Historial conservado
```

------------------------------------------------------------------------

## 3.3 Escenario B --- El cliente quiere agregar un producto

Ejemplo:

``` text
Venta:
- Producto A
- Producto B

Cliente:
"También quiero llevar el Producto C."
```

### Si la venta todavía está abierta

El producto puede incorporarse antes de cerrar la operación:

1.  Se agrega el nuevo producto.
2.  Se valida su stock.
3.  Se recalcula el total.
4.  Se confirma la venta.
5.  Se registra normalmente.

### Si la venta ya fue cerrada o el comprobante ya fue emitido

No se debe sobrescribir silenciosamente la operación anterior.

El sistema deberá:

1.  Localizar la venta original.
2.  Registrar la solicitud de corrección.
3.  Conservar la venta/comprobante original como antecedente.
4.  Aplicar el mecanismo de anulación/corrección que corresponda al
    alcance tributario implementado.
5.  Generar la operación resultante con los productos correspondientes.
6.  Relacionar la operación anterior y la nueva.
7.  Registrar los movimientos de inventario necesarios.
8.  Mantener la trazabilidad completa.

> **Nota de alcance:** en una implementación con comprobantes
> electrónicos reales, una boleta ya emitida no debe tratarse como un
> registro editable libremente. La integración tributaria deberá
> respetar las reglas vigentes aplicables. FarmaApp debe diferenciar
> entre modificar una venta todavía abierta y corregir una operación
> cuyo comprobante ya fue emitido.

------------------------------------------------------------------------

## 3.4 Información de auditoría

Cada corrección debería conservar como mínimo:

-   Venta original.
-   Operación resultante.
-   Usuario responsable.
-   Fecha y hora.
-   Motivo.
-   Productos retirados.
-   Productos agregados.
-   Cantidades.
-   Total anterior.
-   Total resultante.
-   Movimientos de stock.
-   Estado anterior.
-   Estado posterior.

------------------------------------------------------------------------

## 3.5 Estados sugeridos

``` text
ABIERTA
CONFIRMADA
CORRECCION_SOLICITADA
CORREGIDA
ANULADA
DEVUELTA_PARCIAL
DEVUELTA_TOTAL
```

Los nombres definitivos dependerán del modelo de datos del proyecto.

------------------------------------------------------------------------

# 4. Proceso 3 --- Gestión de inventario

## 4.1 Objetivo

Controlar no solo cuánto producto existe, sino también **por qué aumenta
o disminuye**, a qué lote pertenece y cuándo vence.

------------------------------------------------------------------------

## 4.2 Información principal

Por producto se puede administrar:

-   Código.
-   Nombre.
-   Categoría.
-   Stock total.
-   Stock mínimo.
-   Lotes.
-   Fecha de vencimiento.
-   Proveedor.
-   Precio.
-   Estado.

------------------------------------------------------------------------

## 4.3 Movimientos de inventario

No se recomienda modificar el stock sin registrar el motivo.

Ejemplos de movimientos:

``` text
ENTRADA_COMPRA
SALIDA_VENTA
ENTRADA_DEVOLUCION
SALIDA_AJUSTE
ENTRADA_AJUSTE
ANULACION_VENTA
PRODUCTO_VENCIDO
```

Cada movimiento debería registrar:

-   Producto.
-   Lote cuando corresponda.
-   Cantidad.
-   Tipo.
-   Fecha y hora.
-   Usuario.
-   Motivo.
-   Stock anterior.
-   Stock posterior.
-   Referencia a venta, devolución, compra u otra operación relacionada.

Esto permite responder posteriormente:

> ¿Por qué el stock de este producto pasó de 40 a 12?

------------------------------------------------------------------------

# 5. Gestión de lotes y vencimientos

## 5.1 Objetivo

Una farmacia puede tener unidades del mismo producto pertenecientes a
lotes diferentes y con fechas de vencimiento distintas.

Ejemplo:

  Producto             Lote     Cantidad Vencimiento
  -------------------- ------ ---------- -------------
  Paracetamol 500 mg   A001           20 15/11/2026
  Paracetamol 500 mg   B008           50 20/04/2027

El inventario total es de 70 unidades, pero FarmaApp conserva la
separación por lote.

------------------------------------------------------------------------

## 5.2 Prioridad por vencimiento

FarmaApp puede utilizar una estrategia **FEFO (First Expired, First
Out)**: priorizar el lote que vence primero.

En el ejemplo anterior:

``` text
Lote recomendado para salida: A001
Motivo: es el lote con la fecha de vencimiento más próxima.
```

Esta lógica puede implementarse mediante reglas normales del sistema;
**no necesita IA**.

------------------------------------------------------------------------

# 6. Proceso 4 --- Alertas de inventario y reposición

## 6.1 Stock mínimo

Cada producto puede definir un nivel mínimo.

Ejemplo:

``` text
Producto: Paracetamol 500 mg
Stock actual: 8
Stock mínimo: 20

Estado: REQUIERE REPOSICIÓN
```

------------------------------------------------------------------------

## 6.2 Alertas sugeridas

FarmaApp puede generar alertas por:

-   Stock debajo del mínimo.
-   Stock agotado.
-   Lotes próximos a vencer.
-   Productos vencidos.
-   Productos con alta rotación y poca cobertura.
-   Diferencias o ajustes frecuentes de inventario.

Ejemplo:

``` text
🔴 Stock crítico
Paracetamol 500 mg
Actual: 8
Mínimo: 20

🟠 Próximo a vencer
Producto X
Lote: L-2026-10
Vence en 20 días
```

Las alertas básicas deben calcularse mediante reglas del backend. De
esta manera siguen funcionando aunque el servicio de IA no esté
disponible.

------------------------------------------------------------------------

# 7. Reposición y cobertura

Además de comparar `stock_actual` con `stock_minimo`, FarmaApp puede
calcular una cobertura aproximada usando ventas históricas.

Ejemplo:

``` text
Stock disponible: 30 unidades
Consumo promedio: 5 unidades/día

Cobertura aproximada:
30 / 5 = 6 días
```

El sistema puede utilizar este dato para indicar que el producto podría
agotarse aproximadamente en seis días si el ritmo de salida se mantiene.

La estimación no garantiza la demanda futura; sirve como apoyo para la
reposición.

------------------------------------------------------------------------

# 8. Proceso 5 --- Asistente Inteligente de Consulta y Trazabilidad

## 8.1 Objetivo

La IA **no reemplazará el dashboard**.

El dashboard responde preguntas como:

-   ¿Cuánto se vendió?
-   ¿Cuánto stock queda?
-   ¿Qué productos tienen stock crítico?
-   ¿Cuántas devoluciones hubo?

El asistente IA tendrá otro rol:

> **Permitir realizar consultas operativas en lenguaje natural y
> explicar información que está distribuida entre ventas, movimientos,
> devoluciones e inventario.**

------------------------------------------------------------------------

## 8.2 Ejemplos de consultas

### Consulta de trazabilidad

Usuario:

> ¿Qué pasó con la venta 00125?

FarmaApp puede recuperar:

-   venta;
-   detalle;
-   correcciones;
-   devoluciones;
-   movimientos de stock;
-   usuario responsable;
-   fechas.

Después, la IA puede responder de forma comprensible:

``` text
La venta 00125 fue registrada con tres productos.
Posteriormente se solicitó retirar uno de ellos.
La corrección fue registrada por el usuario correspondiente,
el producto retornó al inventario y la operación quedó vinculada
al registro original.
```

------------------------------------------------------------------------

### Investigación de stock

Usuario:

> ¿Por qué tenemos tan poco stock de este producto?

El backend obtiene los movimientos correspondientes y la IA explica la
información encontrada.

Ejemplo conceptual:

``` text
Stock inicial
    ↓
Ventas
    ↓
Devoluciones
    ↓
Ajustes
    ↓
Entradas de compra
    ↓
Stock actual
```

------------------------------------------------------------------------

### Consulta sobre anulaciones

Usuario:

> ¿Por qué ayer hubo tantas anulaciones?

El sistema consulta:

-   anulaciones del período;
-   motivos;
-   usuarios;
-   horarios;
-   operaciones relacionadas.

La IA resume los resultados.

------------------------------------------------------------------------

## 8.3 Arquitectura propuesta

``` text
Usuario
   ↓
Escribe una pregunta
   ↓
FarmaApp identifica la intención
   ↓
Backend valida permisos
   ↓
Backend consulta la base de datos
   ↓
Obtiene únicamente los datos necesarios
   ↓
Construye un contexto reducido
   ↓
API de IA
   ↓
Genera explicación
   ↓
FarmaApp muestra la respuesta
```

La IA **no debería recibir toda la base de datos**.

------------------------------------------------------------------------

## 8.4 Principio fundamental

``` text
BASE DE DATOS + REGLAS
        ↓
determinan los hechos

IA
        ↓
interpreta y explica esos hechos
```

Por tanto:

-   El stock lo calcula FarmaApp.
-   Los totales los calcula FarmaApp.
-   Las fechas las obtiene FarmaApp.
-   Los movimientos los obtiene FarmaApp.
-   Las alertas críticas las determina FarmaApp.
-   La IA ayuda a consultar, resumir y explicar.

------------------------------------------------------------------------

# 9. Seguridad y límites del asistente

Inicialmente, el asistente debería trabajar en **modo de solo lectura**.

La IA no debería ejecutar directamente:

-   anulaciones;
-   devoluciones;
-   modificaciones de stock;
-   eliminación de ventas;
-   creación automática de compras;
-   cambios de precios;
-   operaciones administrativas sensibles.

Una respuesta generada por IA no debe convertirse automáticamente en una
operación irreversible.

Además, las consultas deben respetar el rol del usuario. Un trabajador
no necesariamente debe poder consultar la misma información que un
administrador.

------------------------------------------------------------------------

# 10. Qué NO debe hacer la IA

El objetivo de esta integración no es convertir FarmaApp en un sistema
de diagnóstico médico.

El asistente no debería utilizarse para:

-   diagnosticar enfermedades;
-   sustituir una evaluación profesional;
-   prescribir medicamentos;
-   decidir libremente sustituciones farmacológicas;
-   inventar disponibilidad;
-   inventar movimientos;
-   inventar ventas.

Su función principal dentro del alcance actual es **consulta operativa,
explicación y trazabilidad**.

------------------------------------------------------------------------

# 11. Dashboard vs. Asistente IA

  Dashboard                         Asistente IA
  --------------------------------- -----------------------------------
  Presenta indicadores              Responde preguntas
  Muestra gráficos                  Explica situaciones
  Muestra stock crítico             Permite investigar por qué cambió
  Muestra cantidad de anulaciones   Resume motivos y trazabilidad
  Vista estructurada                Consulta en lenguaje natural
  Uso frecuente y visual            Uso bajo demanda

Los dos componentes se complementan.

------------------------------------------------------------------------

# 12. Ejemplo completo de uso

El administrador observa en el dashboard que un producto tiene poco
stock.

En lugar de revisar manualmente varias pantallas, pregunta:

> ¿Por qué bajó tanto el stock de Paracetamol?

FarmaApp:

1.  identifica el producto;
2.  consulta movimientos;
3.  consulta ventas;
4.  consulta devoluciones y ajustes;
5.  filtra el período relevante;
6.  prepara los datos;
7.  los envía como contexto a la API de IA;
8.  recibe una explicación;
9.  la presenta al administrador.

El administrador puede continuar utilizando las pantallas normales para
verificar los movimientos concretos.

------------------------------------------------------------------------

# 13. Viabilidad económica del asistente IA

> **Esta sección es documentación del proyecto. No es una funcionalidad
> que deba mostrarse dentro del sistema.**

## 13.1 Enfoque

La propuesta busca ser viable incluso para una farmacia pequeña.

No es necesario:

-   entrenar un modelo propio;
-   mantener servidores de IA especializados;
-   procesar toda la base de datos con IA;
-   mantener la IA ejecutándose constantemente.

El consumo ocurre cuando un usuario realiza una consulta.

------------------------------------------------------------------------

## 13.2 Cómo mantener bajo el costo

El backend debe filtrar la información **antes** de llamar a la API.

Mal enfoque:

``` text
Enviar miles de ventas completas a la IA
```

Mejor enfoque:

``` text
Pregunta
   ↓
Consulta SQL / servicio interno
   ↓
Datos relevantes
   ↓
Contexto pequeño
   ↓
API de IA
```

Esto reduce:

-   tokens consumidos;
-   costo;
-   tiempo de respuesta;
-   información innecesariamente compartida.

------------------------------------------------------------------------

## 13.3 Ejemplo económico de referencia

Los costos de las APIs de IA pueden cambiar. Por eso, los valores
siguientes deben entenderse como **un escenario de estimación**, no como
un precio permanente del sistema.

Supongamos una consulta típica que utiliza aproximadamente:

-   2,000 tokens de entrada.
-   300 tokens de salida.

Tomando como referencia un modelo económico con una tarifa hipotética/de
referencia de:

-   US\$0.20 por 1 millón de tokens de entrada.
-   US\$1.20 por 1 millón de tokens de salida.

El cálculo ilustrativo sería:

``` text
Entrada:
2,000 / 1,000,000 × US$0.20 = US$0.00040

Salida:
300 / 1,000,000 × US$1.20 = US$0.00036

Costo estimado por consulta:
US$0.00076
```

Con US\$5:

``` text
US$5 / US$0.00076 ≈ 6,578 consultas
```

------------------------------------------------------------------------

## 13.4 Duración aproximada de US\$5

Bajo **ese escenario de consumo**:

  Uso                   Duración aproximada
  ------------------- ---------------------
  10 consultas/día                 658 días
  20 consultas/día                 329 días
  50 consultas/día                 132 días
  100 consultas/día                 66 días

Para una farmacia pequeña que realice aproximadamente 20 consultas
diarias:

``` text
≈ 329 días
≈ 11 meses
```

Estas cifras son orientativas. El costo real dependerá del modelo
elegido, precios vigentes, longitud del contexto y longitud de las
respuestas.

Antes de implementar o presentar cifras comerciales definitivas se
deberá revisar la tarifa vigente del proveedor de IA.

------------------------------------------------------------------------

# 14. Rentabilidad para una farmacia pequeña

La propuesta no debería venderse como:

> "La IA automáticamente aumentará las ganancias."

La propuesta de valor es:

> **Reducir tiempo dedicado a buscar información, facilitar
> investigaciones operativas y mejorar la trazabilidad de las
> operaciones.**

Ejemplo:

Sin asistente:

``` text
Problema con una venta
→ buscar venta
→ revisar detalle
→ revisar devolución
→ revisar movimientos de stock
→ identificar usuario
→ reconstruir lo ocurrido
```

Con asistente:

``` text
"¿Qué pasó con la venta 00125?"
→ FarmaApp reúne los registros
→ IA genera explicación
→ usuario verifica el detalle cuando lo necesita
```

El beneficio se puede medir posteriormente mediante:

-   tiempo promedio ahorrado por consulta;
-   cantidad de consultas realizadas;
-   incidencias investigadas;
-   errores detectados;
-   tiempo dedicado a reconstruir movimientos.

De esta forma, la empresa puede comparar el pequeño costo de API con el
tiempo operativo ahorrado.

------------------------------------------------------------------------

# 15. Control de costos

Para evitar consumos inesperados se recomienda:

-   limitar el número de consultas por usuario;
-   limitar tokens de respuesta;
-   enviar únicamente contexto necesario;
-   registrar consumo;
-   utilizar un modelo económico para consultas rutinarias;
-   reservar modelos más costosos solo si una función futura realmente
    lo necesita;
-   establecer alertas o presupuestos de consumo en la
    infraestructura/proveedor cuando estén disponibles.

El sistema también puede registrar internamente:

``` text
usuario
fecha
tipo de consulta
tokens de entrada
tokens de salida
costo estimado
```

Esto permite medir si el asistente realmente está siendo utilizado y
cuánto cuesta.

------------------------------------------------------------------------

# 16. Métricas para validar si la IA aporta valor

Durante una prueba piloto pueden medirse:

1.  Consultas realizadas por día.
2.  Tiempo promedio de respuesta.
3.  Tiempo estimado ahorrado.
4.  Consultas resueltas satisfactoriamente.
5.  Costo mensual de API.
6.  Consultas más frecuentes.
7.  Cantidad de investigaciones de trazabilidad.
8.  Errores o respuestas que requirieron revisión manual.

Esto permite tomar una decisión empresarial basada en datos.

------------------------------------------------------------------------

# 17. Roadmap propuesto

## Entrega 1 --- Atención y venta

-   Búsqueda de productos.
-   Consulta de precio.
-   Consulta de stock.
-   Carrito/venta.
-   Registro de venta.
-   Actualización de inventario.

## Entrega 2 --- Corrección y trazabilidad

-   Consulta de ventas.
-   Detalle.
-   Correcciones.
-   Devoluciones.
-   Anulaciones según alcance.
-   Motivos.
-   Historial.
-   Movimientos de stock vinculados.

## Entrega 3 --- Inventario

-   Stock actual.
-   Stock mínimo.
-   Movimientos.
-   Lotes.
-   Vencimientos.
-   Alertas.
-   FEFO.
-   Cobertura aproximada.

## Entrega 4 --- Compras y reposición

-   Proveedores.
-   Órdenes de compra.
-   Recepción.
-   Ingreso por lotes.
-   Reposición.

## Entrega 5 --- Control del negocio

-   Dashboard.
-   Ventas.
-   Productos más vendidos.
-   Stock crítico.
-   Indicadores.
-   Anulaciones y devoluciones.

## Entrega 6 --- Asistente IA

-   Consulta en lenguaje natural.
-   Consulta de trazabilidad.
-   Explicación de movimientos.
-   Investigación de stock.
-   Consulta de anulaciones/devoluciones.
-   Permisos por rol.
-   Registro de consumo.
-   Control de costos.

------------------------------------------------------------------------

# 18. Resumen de propuesta de valor

FarmaApp combina procesos tradicionales con trazabilidad e inteligencia
artificial de forma controlada.

La propuesta no consiste en colocar un chatbot genérico dentro de la
aplicación.

El diseño busca que:

-   **el sistema registre los hechos;**
-   **la base de datos conserve la trazabilidad;**
-   **las reglas del backend controlen inventario y alertas;**
-   **el dashboard presente indicadores;**
-   **la IA permita consultar y comprender la información de forma
    natural.**

De esta manera, la IA complementa los procesos existentes en lugar de
reemplazarlos.

------------------------------------------------------------------------

# 19. Conclusión

Los nuevos procesos propuestos convierten FarmaApp en una solución más
cercana a una operación real:

-   una venta puede ser corregida sin perder su historial;
-   cada cambio de inventario tiene una causa;
-   los lotes y vencimientos pueden controlarse;
-   el sistema puede advertir sobre falta de stock;
-   la reposición puede apoyarse en consumo histórico;
-   el administrador dispone de un dashboard para indicadores;
-   el asistente IA permite investigar y consultar información sin
    recorrer manualmente múltiples módulos.

La prioridad del proyecto debe seguir siendo la **integridad de los
datos y la trazabilidad**. La inteligencia artificial funciona como una
capa adicional de consulta y explicación, con costo controlado y sin
delegarle decisiones críticas del negocio.

------------------------------------------------------------------------

## Nota de mantenimiento

Este documento debe actualizarse cuando cambien:

-   procesos funcionales;
-   modelo de datos;
-   reglas de inventario;
-   integración tributaria;
-   proveedor/modelo de IA;
-   precios de la API;
-   permisos o alcance del asistente.

Las cifras económicas son estimaciones y deben verificarse nuevamente
antes de utilizarlas en una propuesta comercial o exposición futura.
