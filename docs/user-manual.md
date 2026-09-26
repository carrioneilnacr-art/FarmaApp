# FarmaApp - Manual de Usuario y Guía Operativa

Bienvenido al manual oficial de **FarmaApp**, la aplicación móvil desarrollada para facilitar y acelerar la atención a los clientes en la botica.

---

## 1. Conociendo la Pantalla Principal

Al abrir **FarmaApp** en tu smartphone, encontrarás una interfaz limpia diseñada para operar con una sola mano:

```text
┌──────────────────────────────────────────┐
│  🏥 FarmaApp - Punto de Venta           │
├──────────────────────────────────────────┤
│  🔍 [ Buscar medicamento o producto... ] │
├──────────────────────────────────────────┤
│                                          │
│  ┌─────────────────┐ ┌─────────────────┐ │
│  │ 📷 ESCANEAR     │ │ 🛒 VENTA ACTUAL │ │
│  │    CÓDIGO       │ │    (3 ítems)    │ │
│  └─────────────────┘ └─────────────────┘ │
│                                          │
│  ── CATEGORÍAS RÁPIDAS ───────────────── │
│  [ Todos ] [ Analgésicos ] [ Antibióticos]│
│                                          │
│  ── CATÁLOGO DE PRODUCTOS ────────────── │
│  ┌──────────────────────────────────────┐│
│  │ Paracetamol 500 mg (Caja x 100)      ││
│  │ Stock: 60 unid.  │  Precio: S/ 15.50 ││
│  │                [ + Agregar a Venta ] ││
│  └──────────────────────────────────────┘│
│  ┌──────────────────────────────────────┐│
│  │ Ibuprofeno 400 mg (Caja x 20)        ││
│  │ Stock: 45 unid.  │  Precio: S/ 12.00 ││
│  │                [ + Agregar a Venta ] ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

---

## 2. Paso a Paso: Proceso de Atención y Venta Rápida

### Paso 1: Identificar el Producto
Cuando el cliente se acerca al mostrador solicitando un medicamento, tienes dos formas rápidas de encontrarlo:

#### Opción A: Escaneo con Cámara (La más rápida)
1. Pulsa el botón grande **"Escanear Código"** o el ícono flotante de la cámara.
2. Apunta la cámara del teléfono hacia el código de barras en la caja del medicamento o en la pantalla a unos **15 a 20 cm**.
3. En menos de un segundo, la aplicación emitirá una vibración y te mostrará la tarjeta con el nombre, precio y stock actual.

#### Opción B: Búsqueda por Nombre o Síntoma
1. Toca la barra superior de búsqueda.
2. Escribe las primeras letras del fármaco (ej. *"Para"* o *"Ibu"*).
3. Selecciona el producto deseado en la lista desplegada.

---

### Paso 2: Agregar al Carrito y Definir Cantidades
1. En la tarjeta del producto, pulsa **"Agregar a Venta"**.
2. Si el cliente solicita más de una unidad, pulsa el botón **`+`** para incrementar o **`-`** para reducir.
3. El sistema **no te permitirá agregar más unidades del stock disponible**, protegiéndote de vender medicamentos que no existen en el anaquel.

---

### Paso 3: Revisar la Venta Actual
1. Toca la barra inferior o la pestaña **"Venta Actual" (Carrito)**.
2. Podrás verificar:
   * Cada producto agregado con su cantidad.
   * El precio unitario y subtotal por producto.
   * El **Total general a cobrar** en Soles (PEN - S/).
3. Si el cliente decide no llevar algún producto, simplemente pulsa el ícono del **tacho de basura** para retirarlo.

---

### Paso 4: Cobrar y Confirmar la Venta
1. Selecciona el medio de pago entregado por el cliente:
   * 💵 **Efectivo**
   * 📱 **Yape / Plin**
   * 💳 **Tarjeta Débito/Crédito**
2. Pulsa el botón verde principal **"Confirmar Venta (S/ XX.XX)"**.

---

### Paso 5: Mensaje de Éxito y Stock Actualizado
1. Aparecerá en pantalla la confirmación de la venta:

```text
         ╔═══════════════════════════════════╗
         ║        ✓ ¡VENTA REGISTRADA!       ║
         ║                                   ║
         ║   Código: VTA-20260925-1049       ║
         ║   Total Cobrado: S/ 31.00         ║
         ║   Método: Efectivo                ║
         ║                                   ║
         ║   El inventario ha sido           ║
         ║   descontado en el sistema.       ║
         ║                                   ║
         ║      [ Iniciar Nueva Venta ]      ║
         ╚═══════════════════════════════════╝
```

2. Al pulsar **"Iniciar Nueva Venta"**, el carrito quedará limpio para atender al siguiente cliente.
3. El inventario en la base de datos se habrá actualizado inmediatamente.

---

## 3. Preguntas Frecuentes y Consejos Prácticos

### ¿Qué hago si la cámara no detecta el código de barras?
* Asegúrate de que haya buena iluminación en el mostrador.
* Mantén el teléfono quieto a una distancia de aproximadamente 20 centímetros del código.
* Si el producto tiene una etiqueta arrugada o dañada, escribe el nombre directamente en el buscador superior.

### ¿Qué ocurre si se corta la conexión a internet?
* La aplicación te mostrará un aviso de advertencia indicando que no hay conexión. Tus productos en el carrito se mantendrán guardados y podrás presionar **"Reintentar"** una vez restablecida la señal.

### ¿Cómo sé cuándo un medicamento está por agotarse?
* Los productos con stock igual o inferior a 5 unidades mostrarán una etiqueta de advertencia en color naranja (**"Stock Bajo: X unid."**), permitiéndote avisar al encargado para su reposición.
