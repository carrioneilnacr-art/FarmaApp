# Estado de los procesos propuestos

Documento de referencia: [Procesos, inventario y asistente IA](procesos-inventario-asistente-ia.md). Esta tabla distingue la propuesta del software que ya corre en la APK.

| Proceso | Estado en el código | Siguiente paso |
| --- | --- | --- |
| Atención y venta | Implementado: búsqueda, escaneo, carrito, registro atómico y descuento de stock. | Validar el flujo en un teléfono con un entorno de pruebas antes de usarlo en producción. |
| Correcciones | Implementado: historial, devolución, anulación e incidencia en la interfaz y las RPC actuales. Las RPC exigen un usuario de FarmaApp autenticado. | Registrar el usuario responsable de cada operación en el historial. |
| Inventario y alertas básicas | Implementado en `app/inventario.tsx`: consulta de existencias, mínimo, agotados, salidas recientes y cobertura aproximada de 30 días. | La APK local `FarmaApp.apk` se compiló correctamente el 22/10/2026; falta probarla en un teléfono físico. |
| Lotes y vencimientos | Pendiente. El esquema actual solo guarda stock agregado por producto. | Diseñar entrada y salida por lote con FEFO, migración de stock existente y movimientos asociados. |
| Compras y reposición | Pendiente. | Crear proveedores, órdenes y recepción con lotes después del control de acceso. |
| Asistente IA | Implementado: consultas de stock, producto y ventas en una Edge Function; ventas solo para Administrador. Clave cifrada en Vault y límite de 50 consultas diarias por usuario. | Probar la interfaz en un teléfono físico y ampliar las preguntas según necesidades reales. |

La cobertura se estima con `stock / (unidades vendidas en 30 días / 30)`. Si no hay ventas registradas, se muestra “sin datos”. Es una ayuda para reposición y no una predicción de demanda.

## Acceso operativo

La APK nueva inicia sesión por ID (`Administrador` o `Trabajador`) con Supabase Auth. Los IDs se traducen internamente a cuentas técnicas de Auth; el usuario no necesita correo. RLS exige el rol de personal para leer datos operativos. Las RPC de ventas dejaron de ser ejecutables por `anon` y comprueban el rol dentro de cada función `SECURITY DEFINER`. La clave OpenAI reside cifrada en Supabase Vault y solo la Edge Function accede a ella con la clave de servicio del servidor. No hay clave OpenAI en el repositorio ni en la APK. Las contraseñas iniciales se entregan al propietario por separado.

La instalación en un teléfono físico aún debe comprobarse. La app necesita internet para iniciar sesión, consultar el catálogo y usar el asistente. Las operaciones de lote, FEFO, compras y trazabilidad individual de quién modificó una venta siguen pendientes.

Los importes de IA del documento principal son solo ejemplos hipotéticos; se deben verificar precios vigentes antes de contratar o presupuestar una API.
