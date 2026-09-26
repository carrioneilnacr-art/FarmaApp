# FarmaApp - Análisis de Procesos de Negocio: AS-IS vs. TO-BE

## 1. Contexto Operativo y Diagnóstico

En el modelo operativo de las **pequeñas boticas y farmacias convencionales**, la atención al mostrador depende casi en su totalidad de procedimientos manuales, memorización de precios, libretas de control de stock y consultas físicas directas en los estantes.

### 1.1. Puntos Críticos del Proceso Actual (Dolores Operativos)
1. **Demora en Atención:** El boticario debe desplazarse físicamente o buscar en listas en papel para conocer el precio y la existencia del producto.
2. **Errores de Cálculo:** Cálculos manuales o en calculadoras de mano propensos a equivocaciones en el vuelto y en la sumatoria total.
3. **Descuadre de Inventario:** El stock se anota al final del día o no se registra de inmediato, provocando quiebres de stock no detectados (*out-of-stock*).
4. **Dependencia del Personal:** Si el boticario habitual se ausenta, el personal de reemplazo desconoce la ubicación y precios de los fármacos.

---

## 2. Diagrama de Proceso Actual (AS-IS)

El siguiente flujo representa la secuencia manual y fragmentada que sigue el personal de la botica ante la llegada de un cliente:

```mermaid
flowchart TD
    Start([Cliente llega a la botica]) --> Request[Cliente solicita medicamento por nombre o síntoma]
    Request --> Memory{¿Boticario recuerda precio y stock?}
    
    Memory -- No --> PhysSearch[Búsqueda manual en estantes o libretas de precios]
    Memory -- Sí --> CheckShelf[Verificación física de disponibilidad en anaquel]
    PhysSearch --> CheckShelf
    
    CheckShelf --> HasStock{¿Hay producto físico disponible?}
    HasStock -- No --> SuggestAlt[Boticario sugiere medicamento sustituto manualmente]
    SuggestAlt --> ClientAccept{¿Cliente acepta?}
    ClientAccept -- No --> ExitLoss([Venta perdida / Fin])
    ClientAccept -- Sí --> UpdateReq[Cambiar producto en solicitud]
    UpdateReq --> CheckShelf
    
    HasStock -- Sí --> CalcPrice[Cálculo manual del precio total / calculadora]
    CalcPrice --> InformClient[Informar total al cliente]
    InformClient --> PayConfirm{¿Cliente confirma compra?}
    PayConfirm -- No --> ReturnStock[Devolver producto a la repisa]
    ReturnStock --> ExitCancel([Venta cancelada / Fin])
    
    PayConfirm -- Sí --> CollectCash[Cobro en efectivo / POS externo]
    CollectCash --> ManualNote[Anotación manual en libreta de ventas al final del día]
    ManualNote --> DeliverProduct[Entrega de medicamentos al cliente]
    DeliverProduct --> EndSale([Cliente atendido / Fin])

    classDef manual fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#991b1b;
    classDef decision fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#92400e;
    classDef success fill:#dcfce7,stroke:#22c55e,stroke-width:2px,color:#166534;
    classDef finish fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#334155;

    class PhysSearch,CheckShelf,CalcPrice,ManualNote,SuggestAlt,ReturnStock manual;
    class Memory,HasStock,ClientAccept,PayConfirm decision;
    class DeliverProduct,EndSale success;
    class Start,ExitLoss,ExitCancel finish;
```

---

## 3. Diagrama de Proceso Optimizado (TO-BE con FarmaApp)

Con **FarmaApp**, el proceso se centraliza en un dispositivo móvil con lectura óptica de códigos de barra y sincronización inmediata con Supabase:

```mermaid
flowchart TD
    Start([Cliente solicita producto]) --> AppOpen[Boticario abre FarmaApp en su smartphone]
    
    AppOpen --> SelectMethod{¿Cómo desea buscar?}
    
    SelectMethod -- Escaneo Óptico --> Scan[Apunta cámara al código de barras del producto]
    SelectMethod -- Búsqueda por Texto --> Search[Escribe nombre o categoría en buscador]
    
    Scan --> SupaQuery[(Consulta automática a Supabase)]
    Search --> SupaQuery
    
    SupaQuery --> Found{¿Producto existe y tiene stock?}
    
    Found -- Sin Stock / Inactivo --> ShowAlert[App muestra alerta: Sin existencias]
    ShowAlert --> SuggestNew[Buscar alternativa en catálogo digital]
    SuggestNew --> Search
    
    Found -- Disponible --> DisplayInfo[App muestra: Nombre, Precio S/, Stock actual y Categoría]
    DisplayInfo --> AddToCart[Agregar al carrito y definir cantidad]
    
    AddToCart --> MoreItems{¿Desea agregar más productos?}
    MoreItems -- Sí --> SelectMethod
    MoreItems -- No --> ReviewCart[Revisar resumen: Subtotales y Total calculados automáticamente]
    
    ReviewCart --> ConfirmSale[Boticario presiona 'Confirmar Venta']
    
    ConfirmSale --> RPCAtomico[Llamada a función RPC 'registrar_venta_atomica']
    
    subgraph SupabaseCloud [Nube Supabase PostgreSQL]
        RPCAtomico --> LockCheck[1. Bloqueo y verificación estricta de stock]
        LockCheck --> CreateSale[2. Inserción en tabla 'ventas']
        CreateSale --> CreateDetails[3. Inserción en 'detalle_ventas']
        CreateDetails --> DecrementStock[4. Decremento automático de stock]
    end
    
    DecrementStock --> TxSuccess{¿Transacción exitosa?}
    TxSuccess -- Error / Concurrencia --> Rollback[Rollback automático + Mensaje de alerta]
    Rollback --> ReviewCart
    
    TxSuccess -- Éxito --> ShowSuccess[Pantalla de éxito: Código de venta + Resumen]
    ShowSuccess --> Deliver[Entrega de medicamentos al cliente]
    Deliver --> NewSaleOption([Listo para nueva venta])

    classDef tech fill:#e0e7ff,stroke:#6366f1,stroke-width:2px,color:#3730a3;
    classDef cloud fill:#ede9fe,stroke:#8b5cf6,stroke-width:2px,color:#5b21b6;
    classDef action fill:#dcfce7,stroke:#22c55e,stroke-width:2px,color:#166534;
    classDef alert fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#991b1b;
    classDef decision fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#92400e;

    class AppOpen,Scan,Search,DisplayInfo,AddToCart,ReviewCart,ConfirmSale tech;
    class SupaQuery,RPCAtomico,LockCheck,CreateSale,CreateDetails,DecrementStock cloud;
    class ShowSuccess,Deliver,NewSaleOption action;
    class ShowAlert,Rollback alert;
    class SelectMethod,Found,MoreItems,TxSuccess decision;
```

---

## 4. Matriz Comparativa: AS-IS vs. TO-BE

| Dimensión de Análisis | Proceso Manual (AS-IS) | Proceso FarmaApp (TO-BE) | Impacto / Beneficio |
| :--- | :--- | :--- | :--- |
| **Tiempo de Atención** | 3 a 6 minutos por cliente | **30 a 60 segundos** por cliente | Reducción de más del **75% del tiempo de espera** en cola |
| **Búsqueda de Información** | Desplazamiento físico y revisión de cuadernos | Escaneo instantáneo (< 200 ms) o búsqueda predictiva | Cero pérdida de tiempo en anaqueles |
| **Cálculo de Precios y Totales** | Manual / calculadora con riesgo de error | Automático y en tiempo real ($P \times Q$) | Eliminación de errores aritméticos en cobro |
| **Actualización de Stock** | Libreta manual al final del día o nula | **Decremento atómico en tiempo real** | Cero descuadres entre stock físico y lógico |
| **Control de Stock Mínimo** | Reactivo (cuando el producto se acaba en mostrador) | Alertas visuales inmediatas cuando $stock \le stock\_minimo$ | Reabastecimiento preventivo |
| **Trazabilidad de Ventas** | Tickets manuales extraviables | Registro permanente con UUID y código de venta | Historial auditable y estructurado |

---

## 5. Actores y Responsabilidades en el Proceso

```text
┌─────────────────────────┐         ┌─────────────────────────┐
│     CLIENTE FINAL       │         │   TRABAJADOR / BOTICARIO│
├─────────────────────────┤         ├─────────────────────────┤
│ • Solicita medicamentos │ ◄─────► │ • Escanea / Busca ítem  │
│ • Realiza el pago       │         │ • Agrega al carrito     │
│ • Recibe sus productos  │         │ • Confirma la venta     │
└─────────────────────────┘         └────────────┬────────────┘
                                                 │ HTTPS
                                                 ▼
                                    ┌─────────────────────────┐
                                    │    SUPABASE BACKEND     │
                                    ├─────────────────────────┤
                                    │ • Consulta catálogo     │
                                    │ • Valida existencias    │
                                    │ • Ejecuta RPC atómica   │
                                    └─────────────────────────┘
```
