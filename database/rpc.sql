-- ==============================================================================
-- FarmaApp - Función RPC Atómica: registrar_venta_atomica
-- Transacción ACID para Registro de Ventas, Detalle y Descuento de Stock
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.registrar_venta_atomica(
    p_items JSONB,
    p_cliente_nombre TEXT DEFAULT NULL,
    p_cliente_documento TEXT DEFAULT NULL,
    p_metodo_pago TEXT DEFAULT 'EFECTIVO'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_venta_id UUID;
    v_codigo_venta VARCHAR(30);
    v_total NUMERIC(10, 2) := 0;
    v_item RECORD;
    v_producto RECORD;
    v_items_array JSONB;
    v_cliente_nom TEXT := p_cliente_nombre;
    v_cliente_doc TEXT := p_cliente_documento;
    v_metodo TEXT := UPPER(COALESCE(p_metodo_pago, 'EFECTIVO'));
    v_items_count INT := 0;
BEGIN
    -- 1. Normalizar y verificar estructura de entrada
    -- Soporte para cuando se envía un único objeto payload o directamente el array
    IF jsonb_typeof(p_items) = 'object' AND p_items ? 'items' THEN
        v_items_array := p_items->'items';
        IF p_items ? 'cliente_nombre' THEN
            v_cliente_nom := p_items->>'cliente_nombre';
        END IF;
        IF p_items ? 'cliente_documento' THEN
            v_cliente_doc := p_items->>'cliente_documento';
        END IF;
        IF p_items ? 'metodo_pago' THEN
            v_metodo := UPPER(p_items->>'metodo_pago');
        END IF;
    ELSE
        v_items_array := p_items;
    END IF;

    -- Validar que el array de items no sea nulo ni esté vacío
    IF v_items_array IS NULL OR jsonb_array_length(v_items_array) = 0 THEN
        RAISE EXCEPTION 'El carrito de compras no puede estar vacío';
    END IF;

    -- Validar método de pago
    IF v_metodo NOT IN ('EFECTIVO', 'TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA') THEN
        v_metodo := 'EFECTIVO';
    END IF;

    -- 2. Generar código de venta único correlativo/aleatorio seguro
    v_codigo_venta := 'VTA-' || to_char(timezone('America/Lima', now()), 'YYYYMMDD') || '-' || 
                      LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');

    -- 3. Crear tabla temporal en memoria para calcular subtotales y validar stock con bloqueo FOR UPDATE
    CREATE TEMP TABLE tmp_venta_items (
        producto_id UUID,
        nombre VARCHAR(255),
        cantidad INT,
        precio_unitario NUMERIC(10, 2),
        subtotal NUMERIC(10, 2)
    ) ON COMMIT DROP;

    -- Iterar sobre cada item recibido
    FOR v_item IN 
        SELECT 
            (elem->>'producto_id')::UUID AS producto_id,
            COALESCE((elem->>'cantidad')::INT, 1) AS cantidad
        FROM jsonb_array_elements(v_items_array) AS elem
    LOOP
        -- Validar cantidad
        IF v_item.cantidad <= 0 THEN
            RAISE EXCEPTION 'La cantidad solicitada para el producto % debe ser mayor a 0', v_item.producto_id;
        END IF;

        -- Bloquear y consultar producto con FOR UPDATE para evitar condiciones de carrera (Race Condition)
        SELECT id, nombre, precio, stock, activo
        INTO v_producto
        FROM public.productos
        WHERE id = v_item.producto_id
        FOR UPDATE;

        -- Validar existencia del producto
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto con ID % no encontrado en el catálogo', v_item.producto_id;
        END IF;

        -- Validar que el producto esté activo
        IF NOT v_producto.activo THEN
            RAISE EXCEPTION 'El producto "%" se encuentra inactivo y no puede ser vendido', v_producto.nombre;
        END IF;

        -- Validar stock suficiente
        IF v_producto.stock < v_item.cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto "%". Stock disponible: %, solicitado: %', 
                v_producto.nombre, v_producto.stock, v_item.cantidad;
        END IF;

        -- Calcular subtotal
        INSERT INTO tmp_venta_items (producto_id, nombre, cantidad, precio_unitario, subtotal)
        VALUES (
            v_producto.id,
            v_producto.nombre,
            v_item.cantidad,
            v_producto.precio,
            ROUND((v_item.cantidad * v_producto.precio)::NUMERIC, 2)
        );

        -- Acumular total
        v_total := v_total + ROUND((v_item.cantidad * v_producto.precio)::NUMERIC, 2);
        v_items_count := v_items_count + 1;
    END LOOP;

    -- 4. Registrar cabecera en 'ventas'
    INSERT INTO public.ventas (
        codigo_venta,
        total,
        cliente_nombre,
        cliente_documento,
        metodo_pago,
        estado
    )
    VALUES (
        v_codigo_venta,
        v_total,
        NULLIF(TRIM(v_cliente_nom), ''),
        NULLIF(TRIM(v_cliente_doc), ''),
        v_metodo,
        'COMPLETADA'
    )
    RETURNING id INTO v_venta_id;

    -- 5. Registrar cada item en 'detalle_ventas'
    INSERT INTO public.detalle_ventas (
        venta_id,
        producto_id,
        cantidad,
        precio_unitario,
        subtotal
    )
    SELECT 
        v_venta_id,
        producto_id,
        cantidad,
        precio_unitario,
        subtotal
    FROM tmp_venta_items;

    -- 6. Descontar el stock en 'productos'
    UPDATE public.productos p
    SET 
        stock = p.stock - t.cantidad,
        updated_at = timezone('utc'::text, now())
    FROM tmp_venta_items t
    WHERE p.id = t.producto_id;

    -- 7. Retornar respuesta exitosa con metadata de la venta
    RETURN jsonb_build_object(
        'success', true,
        'venta_id', v_venta_id,
        'codigo_venta', v_codigo_venta,
        'total', v_total,
        'items_procesados', v_items_count,
        'fecha', timezone('America/Lima', now()),
        'mensaje', 'Venta registrada e inventario actualizado exitosamente'
    );

EXCEPTION
    WHEN OTHERS THEN
        -- En caso de cualquier error, PostgreSQL revierte automáticamente toda la transacción
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Permisos de ejecución
GRANT EXECUTE ON FUNCTION public.registrar_venta_atomica(JSONB, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
