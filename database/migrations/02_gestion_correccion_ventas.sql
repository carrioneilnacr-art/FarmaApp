-- ==============================================================================
-- FarmaApp - Migración 02: Gestión y Corrección de Ventas (Proceso 2)
-- Tablas: devoluciones, detalle_devoluciones, incidencias_ventas,
--         movimientos_stock, historial_ventas
-- Columnas en ventas: numero_venta, subtotal, comprobante_*, venta_origen_id
-- RPCs: registrar_devolucion_atomica, anular_venta_atomica,
--       obtener_resumen_diario, registrar_incidencia_venta
-- ==============================================================================

-- 1. Ampliar tabla 'ventas' sin alterar datos existentes
ALTER TABLE public.ventas
    ADD COLUMN IF NOT EXISTS numero_venta VARCHAR(30),
    ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS comprobante_tipo VARCHAR(20) DEFAULT 'BOLETA',
    ADD COLUMN IF NOT EXISTS comprobante_serie VARCHAR(10) DEFAULT 'B001',
    ADD COLUMN IF NOT EXISTS comprobante_numero VARCHAR(20),
    ADD COLUMN IF NOT EXISTS venta_origen_id UUID REFERENCES public.ventas(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Actualizar constraint de 'estado' en ventas para soportar el ciclo de vida completo:
-- ABIERTA, PAGADA, EMITIDA, ANULADA, DEVUELTA, COMPLETADA
DO $$
BEGIN
    ALTER TABLE public.ventas DROP CONSTRAINT IF EXISTS ventas_estado_check;
    ALTER TABLE public.ventas 
        ADD CONSTRAINT ventas_estado_check 
        CHECK (estado IN ('ABIERTA', 'PAGADA', 'EMITIDA', 'ANULADA', 'DEVUELTA', 'COMPLETADA'));
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- Sincronizar datos existentes
UPDATE public.ventas 
SET 
    numero_venta = COALESCE(numero_venta, codigo_venta),
    subtotal = COALESCE(subtotal, total),
    comprobante_numero = COALESCE(comprobante_numero, SUBSTRING(codigo_venta FROM '[0-9]+$')),
    estado = CASE WHEN estado = 'COMPLETADA' THEN 'EMITIDA' ELSE estado END
WHERE numero_venta IS NULL OR subtotal IS NULL OR estado = 'COMPLETADA';

-- 2. Tabla 'movimientos_stock' (Kardex simplificado y trazabilidad de inventario)
CREATE TABLE IF NOT EXISTS public.movimientos_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('VENTA', 'DEVOLUCION', 'ANULACION', 'AJUSTE')),
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    referencia_tipo VARCHAR(30),
    referencia_id UUID,
    motivo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.movimientos_stock IS 'Auditoría de variaciones de inventario por ventas, devoluciones y correcciones';

-- 3. Tabla 'devoluciones'
CREATE TABLE IF NOT EXISTS public.devoluciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE RESTRICT,
    codigo_devolucion VARCHAR(30) NOT NULL UNIQUE,
    fecha TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    motivo TEXT NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'COMPLETADA' CHECK (estado IN ('COMPLETADA', 'ANULADA')),
    total_devuelto NUMERIC(10, 2) NOT NULL CHECK (total_devuelto >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.devoluciones IS 'Cabecera de devoluciones parciales o totales de medicamentos';

-- 4. Tabla 'detalle_devoluciones'
CREATE TABLE IF NOT EXISTS public.detalle_devoluciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    devolucion_id UUID NOT NULL REFERENCES public.devoluciones(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.detalle_devoluciones IS 'Detalle de medicamentos retornados al inventario';

-- 5. Tabla 'incidencias_ventas'
CREATE TABLE IF NOT EXISTS public.incidencias_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE RESTRICT,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('ANULACION', 'DEVOLUCION', 'CORRECCION', 'AGREGAR_PRODUCTO', 'OTRO')),
    descripcion TEXT NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PROCESADA' CHECK (estado IN ('PENDIENTE', 'PROCESADA', 'CANCELADA')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.incidencias_ventas IS 'Registro de incidencias operativas y solicitudes de gestión posterior';

-- 6. Tabla 'historial_ventas' (Auditoría cronológica de eventos por venta)
CREATE TABLE IF NOT EXISTS public.historial_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
    evento VARCHAR(60) NOT NULL,
    descripcion TEXT,
    estado_anterior VARCHAR(30),
    estado_nuevo VARCHAR(30),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.historial_ventas IS 'Línea de tiempo inmutable con los hitos de cada venta';

-- 7. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON public.ventas (estado);
CREATE INDEX IF NOT EXISTS idx_ventas_numero_venta ON public.ventas (numero_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_origen_id ON public.ventas (venta_origen_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_venta_id ON public.devoluciones (venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_devoluciones_dev_id ON public.detalle_devoluciones (devolucion_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_venta_id ON public.incidencias_ventas (venta_id);
CREATE INDEX IF NOT EXISTS idx_historial_venta_id ON public.historial_ventas (venta_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto_id ON public.movimientos_stock (producto_id, created_at DESC);

-- 8. Seguridad RLS
ALTER TABLE public.movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_devoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidencias_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_ventas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Lectura pública de movimientos_stock" ON public.movimientos_stock;
    CREATE POLICY "Lectura pública de movimientos_stock" ON public.movimientos_stock FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Lectura pública de devoluciones" ON public.devoluciones;
    CREATE POLICY "Lectura pública de devoluciones" ON public.devoluciones FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Lectura pública de detalle_devoluciones" ON public.detalle_devoluciones;
    CREATE POLICY "Lectura pública de detalle_devoluciones" ON public.detalle_devoluciones FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Lectura pública de incidencias_ventas" ON public.incidencias_ventas;
    CREATE POLICY "Lectura pública de incidencias_ventas" ON public.incidencias_ventas FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Lectura pública de historial_ventas" ON public.historial_ventas;
    CREATE POLICY "Lectura pública de historial_ventas" ON public.historial_ventas FOR SELECT USING (true);
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

GRANT SELECT, INSERT, UPDATE ON public.movimientos_stock TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.devoluciones TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.detalle_devoluciones TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.incidencias_ventas TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.historial_ventas TO anon, authenticated, service_role;

-- ==============================================================================
-- 9. RPC: registrar_devolucion_atomica
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.registrar_devolucion_atomica(
    p_venta_id UUID,
    p_items JSONB,
    p_motivo TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_venta RECORD;
    v_devolucion_id UUID;
    v_codigo_dev VARCHAR(30);
    v_item RECORD;
    v_detalle RECORD;
    v_producto RECORD;
    v_total_devuelto NUMERIC(10, 2) := 0;
    v_ya_devuelto INT;
    v_items_array JSONB;
    v_nuevo_stock INT;
BEGIN
    -- 1. Validar venta
    SELECT * INTO v_venta
    FROM public.ventas
    WHERE id = p_venta_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Venta no encontrada con ID %', p_venta_id;
    END IF;

    IF v_venta.estado = 'ANULADA' THEN
        RAISE EXCEPTION 'No es posible registrar devoluciones en una venta ANULADA';
    END IF;

    -- Normalizar array de items
    IF jsonb_typeof(p_items) = 'object' AND p_items ? 'items' THEN
        v_items_array := p_items->'items';
    ELSE
        v_items_array := p_items;
    END IF;

    IF v_items_array IS NULL OR jsonb_array_length(v_items_array) = 0 THEN
        RAISE EXCEPTION 'Debe especificar al menos un producto a devolver';
    END IF;

    -- Código único de devolución
    v_codigo_dev := 'DEV-' || to_char(timezone('America/Lima', now()), 'YYYYMMDD') || '-' || 
                    LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');

    -- Insertar cabecera de devolución
    INSERT INTO public.devoluciones (
        venta_id,
        codigo_devolucion,
        fecha,
        motivo,
        estado,
        total_devuelto
    )
    VALUES (
        p_venta_id,
        v_codigo_dev,
        timezone('utc'::text, now()),
        COALESCE(TRIM(p_motivo), 'Devolución de producto solicitada por cliente'),
        'COMPLETADA',
        0
    )
    RETURNING id INTO v_devolucion_id;

    -- Iterar items a devolver
    FOR v_item IN
        SELECT
            (elem->>'producto_id')::UUID AS producto_id,
            COALESCE((elem->>'cantidad')::INT, 1) AS cantidad
        FROM jsonb_array_elements(v_items_array) AS elem
    LOOP
        IF v_item.cantidad <= 0 THEN
            RAISE EXCEPTION 'La cantidad a devolver debe ser mayor a 0';
        END IF;

        -- Obtener detalle original vendido
        SELECT * INTO v_detalle
        FROM public.detalle_ventas
        WHERE venta_id = p_venta_id AND producto_id = v_item.producto_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'El producto % no forma parte de la venta %', v_item.producto_id, v_venta.codigo_venta;
        END IF;

        -- Calcular cuánto ya se devolvió de este producto
        SELECT COALESCE(SUM(dd.cantidad), 0) INTO v_ya_devuelto
        FROM public.detalle_devoluciones dd
        JOIN public.devoluciones d ON d.id = dd.devolucion_id
        WHERE d.venta_id = p_venta_id AND dd.producto_id = v_item.producto_id;

        IF (v_ya_devuelto + v_item.cantidad) > v_detalle.cantidad THEN
            RAISE EXCEPTION 'La cantidad a devolver (%) supera la cantidad vendida disponible (%)', 
                v_item.cantidad, (v_detalle.cantidad - v_ya_devuelto);
        END IF;

        -- Insertar detalle de devolución
        INSERT INTO public.detalle_devoluciones (
            devolucion_id,
            producto_id,
            cantidad,
            precio_unitario,
            subtotal
        )
        VALUES (
            v_devolucion_id,
            v_item.producto_id,
            v_item.cantidad,
            v_detalle.precio_unitario,
            ROUND((v_item.cantidad * v_detalle.precio_unitario)::NUMERIC, 2)
        );

        v_total_devuelto := v_total_devuelto + ROUND((v_item.cantidad * v_detalle.precio_unitario)::NUMERIC, 2);

        -- Bloquear producto para reingreso a stock
        SELECT * INTO v_producto
        FROM public.productos
        WHERE id = v_item.producto_id
        FOR UPDATE;

        v_nuevo_stock := v_producto.stock + v_item.cantidad;

        UPDATE public.productos
        SET stock = v_nuevo_stock, updated_at = timezone('utc'::text, now())
        WHERE id = v_item.producto_id;

        -- Registrar movimiento de stock (Kardex)
        INSERT INTO public.movimientos_stock (
            producto_id,
            tipo,
            cantidad,
            stock_anterior,
            stock_nuevo,
            referencia_tipo,
            referencia_id,
            motivo
        )
        VALUES (
            v_item.producto_id,
            'DEVOLUCION',
            v_item.cantidad,
            v_producto.stock,
            v_nuevo_stock,
            'DEVOLUCION',
            v_devolucion_id,
            p_motivo
        );
    END LOOP;

    -- Actualizar total en cabecera de devolución
    UPDATE public.devoluciones
    SET total_devuelto = v_total_devuelto
    WHERE id = v_devolucion_id;

    -- Actualizar estado de la venta a 'DEVUELTA'
    UPDATE public.ventas
    SET estado = 'DEVUELTA', updated_at = timezone('utc'::text, now())
    WHERE id = p_venta_id;

    -- Registrar incidencia
    INSERT INTO public.incidencias_ventas (
        venta_id,
        tipo,
        descripcion,
        estado
    )
    VALUES (
        p_venta_id,
        'DEVOLUCION',
        'Devolución registrada (' || v_codigo_dev || ') por S/ ' || v_total_devuelto || '. Motivo: ' || p_motivo,
        'PROCESADA'
    );

    -- Registrar en historial de eventos
    INSERT INTO public.historial_ventas (
        venta_id,
        evento,
        descripcion,
        estado_anterior,
        estado_nuevo,
        metadata
    )
    VALUES (
        p_venta_id,
        'DEVOLUCION_REGISTRADA',
        'Se registró devolución ' || v_codigo_dev || ' por S/ ' || v_total_devuelto || '. Motivo: ' || p_motivo,
        v_venta.estado,
        'DEVUELTA',
        jsonb_build_object('devolucion_id', v_devolucion_id, 'codigo_devolucion', v_codigo_dev, 'monto', v_total_devuelto)
    );

    RETURN jsonb_build_object(
        'success', true,
        'devolucion_id', v_devolucion_id,
        'codigo_devolucion', v_codigo_dev,
        'total_devuelto', v_total_devuelto,
        'nuevo_estado', 'DEVUELTA',
        'mensaje', 'Devolución registrada exitosamente y stock retornado a inventario'
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_devolucion_atomica(UUID, JSONB, TEXT) TO anon, authenticated, service_role;

-- ==============================================================================
-- 10. RPC: anular_venta_atomica
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.anular_venta_atomica(
    p_venta_id UUID,
    p_motivo TEXT,
    p_revertir_stock BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_venta RECORD;
    v_item RECORD;
    v_producto RECORD;
    v_ya_devuelto INT;
    v_cant_a_revertir INT;
    v_nuevo_stock INT;
    v_motivo_clean TEXT := COALESCE(NULLIF(TRIM(p_motivo), ''), 'Anulación solicitada por cajero');
BEGIN
    SELECT * INTO v_venta
    FROM public.ventas
    WHERE id = p_venta_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No encontramos una venta con ese número o identificador';
    END IF;

    IF v_venta.estado = 'ANULADA' THEN
        RAISE EXCEPTION 'Esta venta ya se encuentra anulada';
    END IF;

    -- Si se solicita revertir stock, calcular la cantidad neta vendida (sin contar lo ya devuelto)
    IF p_revertir_stock THEN
        FOR v_item IN
            SELECT dv.producto_id, dv.cantidad
            FROM public.detalle_ventas dv
            WHERE dv.venta_id = p_venta_id
        LOOP
            -- Cantidad que ya haya sido devuelta previamente
            SELECT COALESCE(SUM(dd.cantidad), 0) INTO v_ya_devuelto
            FROM public.detalle_devoluciones dd
            JOIN public.devoluciones d ON d.id = dd.devolucion_id
            WHERE d.venta_id = p_venta_id AND dd.producto_id = v_item.producto_id;

            v_cant_a_revertir := v_item.cantidad - v_ya_devuelto;

            IF v_cant_a_revertir > 0 THEN
                SELECT * INTO v_producto
                FROM public.productos
                WHERE id = v_item.producto_id
                FOR UPDATE;

                v_nuevo_stock := v_producto.stock + v_cant_a_revertir;

                UPDATE public.productos
                SET stock = v_nuevo_stock, updated_at = timezone('utc'::text, now())
                WHERE id = v_item.producto_id;

                INSERT INTO public.movimientos_stock (
                    producto_id,
                    tipo,
                    cantidad,
                    stock_anterior,
                    stock_nuevo,
                    referencia_tipo,
                    referencia_id,
                    motivo
                )
                VALUES (
                    v_item.producto_id,
                    'ANULACION',
                    v_cant_a_revertir,
                    v_producto.stock,
                    v_nuevo_stock,
                    'VENTA',
                    p_venta_id,
                    v_motivo_clean
                );
            END IF;
        END LOOP;
    END IF;

    -- Cambiar estado a ANULADA (NUNCA DELETE)
    UPDATE public.ventas
    SET estado = 'ANULADA', updated_at = timezone('utc'::text, now())
    WHERE id = p_venta_id;

    -- Registrar incidencia
    INSERT INTO public.incidencias_ventas (
        venta_id,
        tipo,
        descripcion,
        estado
    )
    VALUES (
        p_venta_id,
        'ANULACION',
        'Venta anulada. Motivo: ' || v_motivo_clean,
        'PROCESADA'
    );

    -- Registrar en historial de eventos
    INSERT INTO public.historial_ventas (
        venta_id,
        evento,
        descripcion,
        estado_anterior,
        estado_nuevo,
        metadata
    )
    VALUES (
        p_venta_id,
        'VENTA_ANULADA',
        'Operación anulada conservando trazabilidad. Motivo: ' || v_motivo_clean,
        v_venta.estado,
        'ANULADA',
        jsonb_build_object('motivo', v_motivo_clean, 'stock_revertido', p_revertir_stock)
    );

    RETURN jsonb_build_object(
        'success', true,
        'venta_id', p_venta_id,
        'codigo_venta', v_venta.codigo_venta,
        'nuevo_estado', 'ANULADA',
        'mensaje', 'Venta anulada exitosamente sin eliminar datos históricos'
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.anular_venta_atomica(UUID, TEXT, BOOLEAN) TO anon, authenticated, service_role;

-- ==============================================================================
-- 11. RPC: obtener_resumen_diario
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.obtener_resumen_diario(
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ventas_realizadas INT := 0;
    v_total_vendido NUMERIC(10, 2) := 0;
    v_ventas_anuladas INT := 0;
    v_devoluciones_count INT := 0;
    v_productos_vendidos INT := 0;
    v_productos_devueltos INT := 0;
BEGIN
    -- 1. Ventas realizadas (EMITIDA, PAGADA, DEVUELTA, COMPLETADA)
    SELECT 
        COALESCE(COUNT(*), 0),
        COALESCE(SUM(total), 0)
    INTO v_ventas_realizadas, v_total_vendido
    FROM public.ventas
    WHERE DATE(timezone('America/Lima', created_at)) = p_fecha
      AND estado NOT IN ('ANULADA', 'ABIERTA');

    -- 2. Ventas anuladas
    SELECT COALESCE(COUNT(*), 0)
    INTO v_ventas_anuladas
    FROM public.ventas
    WHERE DATE(timezone('America/Lima', created_at)) = p_fecha
      AND estado = 'ANULADA';

    -- 3. Devoluciones
    SELECT COALESCE(COUNT(*), 0)
    INTO v_devoluciones_count
    FROM public.devoluciones
    WHERE DATE(timezone('America/Lima', fecha)) = p_fecha;

    -- 4. Productos vendidos
    SELECT COALESCE(SUM(dv.cantidad), 0)
    INTO v_productos_vendidos
    FROM public.detalle_ventas dv
    JOIN public.ventas v ON v.id = dv.venta_id
    WHERE DATE(timezone('America/Lima', v.created_at)) = p_fecha
      AND v.estado NOT IN ('ANULADA', 'ABIERTA');

    -- 5. Productos devueltos
    SELECT COALESCE(SUM(dd.cantidad), 0)
    INTO v_productos_devueltos
    FROM public.detalle_devoluciones dd
    JOIN public.devoluciones d ON d.id = dd.devolucion_id
    WHERE DATE(timezone('America/Lima', d.fecha)) = p_fecha;

    RETURN jsonb_build_object(
        'fecha', p_fecha,
        'ventas_realizadas', v_ventas_realizadas,
        'total_vendido', v_total_vendido,
        'ventas_anuladas', v_ventas_anuladas,
        'devoluciones', v_devoluciones_count,
        'productos_vendidos', v_productos_vendidos,
        'productos_devueltos', v_productos_devueltos
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_resumen_diario(DATE) TO anon, authenticated, service_role;

-- ==============================================================================
-- 12. RPC: registrar_incidencia_venta
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.registrar_incidencia_venta(
    p_venta_id UUID,
    p_tipo TEXT,
    p_descripcion TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_incidencia_id UUID;
    v_tipo_clean TEXT := UPPER(COALESCE(TRIM(p_tipo), 'OTRO'));
BEGIN
    IF v_tipo_clean NOT IN ('ANULACION', 'DEVOLUCION', 'CORRECCION', 'AGREGAR_PRODUCTO', 'OTRO') THEN
        v_tipo_clean := 'OTRO';
    END IF;

    INSERT INTO public.incidencias_ventas (
        venta_id,
        tipo,
        descripcion,
        estado
    )
    VALUES (
        p_venta_id,
        v_tipo_clean,
        COALESCE(TRIM(p_descripcion), 'Incidencia registrada'),
        'PROCESADA'
    )
    RETURNING id INTO v_incidencia_id;

    INSERT INTO public.historial_ventas (
        venta_id,
        evento,
        descripcion,
        metadata
    )
    VALUES (
        p_venta_id,
        'INCIDENCIA_REGISTRADA',
        'Tipo: ' || v_tipo_clean || '. ' || COALESCE(TRIM(p_descripcion), ''),
        jsonb_build_object('incidencia_id', v_incidencia_id, 'tipo', v_tipo_clean)
    );

    RETURN jsonb_build_object(
        'success', true,
        'incidencia_id', v_incidencia_id,
        'mensaje', 'Incidencia registrada en la venta exitosamente'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_incidencia_venta(UUID, TEXT, TEXT) TO anon, authenticated, service_role;

-- ==============================================================================
-- 13. Actualización de registrar_venta_atomica con Kardex e Historial
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
    v_numero_venta VARCHAR(30);
    v_total NUMERIC(10, 2) := 0;
    v_item RECORD;
    v_producto RECORD;
    v_items_array JSONB;
    v_cliente_nom TEXT := p_cliente_nombre;
    v_cliente_doc TEXT := p_cliente_documento;
    v_metodo TEXT := UPPER(COALESCE(p_metodo_pago, 'EFECTIVO'));
    v_items_count INT := 0;
    v_origen_id UUID := NULL;
    v_secuencia_num VARCHAR(20);
    v_nuevo_stock INT;
BEGIN
    -- 1. Normalizar entrada
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
        IF p_items ? 'venta_origen_id' AND (p_items->>'venta_origen_id') IS NOT NULL AND (p_items->>'venta_origen_id') != '' THEN
            v_origen_id := (p_items->>'venta_origen_id')::UUID;
        END IF;
    ELSE
        v_items_array := p_items;
    END IF;

    IF v_items_array IS NULL OR jsonb_array_length(v_items_array) = 0 THEN
        RAISE EXCEPTION 'El carrito de compras no puede estar vacío';
    END IF;

    IF v_metodo NOT IN ('EFECTIVO', 'TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA') THEN
        v_metodo := 'EFECTIVO';
    END IF;

    -- Generar correlativo
    v_secuencia_num := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    v_codigo_venta := 'VTA-' || to_char(timezone('America/Lima', now()), 'YYYYMMDD') || '-' || v_secuencia_num;
    v_numero_venta := '#' || v_secuencia_num;

    -- Tabla temporal para procesar items
    CREATE TEMP TABLE tmp_venta_items (
        producto_id UUID,
        nombre VARCHAR(255),
        cantidad INT,
        precio_unitario NUMERIC(10, 2),
        subtotal NUMERIC(10, 2),
        stock_actual INT
    ) ON COMMIT DROP;

    FOR v_item IN 
        SELECT 
            (elem->>'producto_id')::UUID AS producto_id,
            COALESCE((elem->>'cantidad')::INT, 1) AS cantidad
        FROM jsonb_array_elements(v_items_array) AS elem
    LOOP
        IF v_item.cantidad <= 0 THEN
            RAISE EXCEPTION 'La cantidad solicitada para el producto % debe ser mayor a 0', v_item.producto_id;
        END IF;

        SELECT id, nombre, precio, stock, activo
        INTO v_producto
        FROM public.productos
        WHERE id = v_item.producto_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto con ID % no encontrado en el catálogo', v_item.producto_id;
        END IF;

        IF NOT v_producto.activo THEN
            RAISE EXCEPTION 'El producto "%" se encuentra inactivo y no puede ser vendido', v_producto.nombre;
        END IF;

        IF v_producto.stock < v_item.cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto "%". Stock disponible: %, solicitado: %', 
                v_producto.nombre, v_producto.stock, v_item.cantidad;
        END IF;

        INSERT INTO tmp_venta_items (producto_id, nombre, cantidad, precio_unitario, subtotal, stock_actual)
        VALUES (
            v_producto.id,
            v_producto.nombre,
            v_item.cantidad,
            v_producto.precio,
            ROUND((v_item.cantidad * v_producto.precio)::NUMERIC, 2),
            v_producto.stock
        );

        v_total := v_total + ROUND((v_item.cantidad * v_producto.precio)::NUMERIC, 2);
        v_items_count := v_items_count + 1;
    END LOOP;

    -- Insertar venta con estado EMITIDA
    INSERT INTO public.ventas (
        codigo_venta,
        numero_venta,
        subtotal,
        total,
        cliente_nombre,
        cliente_documento,
        metodo_pago,
        estado,
        comprobante_tipo,
        comprobante_serie,
        comprobante_numero,
        venta_origen_id
    )
    VALUES (
        v_codigo_venta,
        v_numero_venta,
        v_total,
        v_total,
        NULLIF(TRIM(v_cliente_nom), ''),
        NULLIF(TRIM(v_cliente_doc), ''),
        v_metodo,
        'EMITIDA',
        'BOLETA',
        'B001',
        v_secuencia_num,
        v_origen_id
    )
    RETURNING id INTO v_venta_id;

    -- Insertar detalle de venta
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

    -- Actualizar stock y registrar Kardex (movimientos_stock)
    FOR v_item IN SELECT * FROM tmp_venta_items LOOP
        v_nuevo_stock := v_item.stock_actual - v_item.cantidad;

        UPDATE public.productos
        SET stock = v_nuevo_stock, updated_at = timezone('utc'::text, now())
        WHERE id = v_item.producto_id;

        INSERT INTO public.movimientos_stock (
            producto_id,
            tipo,
            cantidad,
            stock_anterior,
            stock_nuevo,
            referencia_tipo,
            referencia_id,
            motivo
        )
        VALUES (
            v_item.producto_id,
            'VENTA',
            v_item.cantidad,
            v_item.stock_actual,
            v_nuevo_stock,
            'VENTA',
            v_venta_id,
            'Venta en mostrador ' || v_codigo_venta
        );
    END LOOP;

    -- Registrar hito en historial de auditoría
    INSERT INTO public.historial_ventas (
        venta_id,
        evento,
        descripcion,
        estado_anterior,
        estado_nuevo,
        metadata
    )
    VALUES 
    (
        v_venta_id,
        'VENTA_REGISTRADA',
        'Venta creada por cajero con ' || v_items_count || ' items por un total de S/ ' || v_total,
        'ABIERTA',
        'PAGADA',
        jsonb_build_object('metodo_pago', v_metodo, 'total', v_total)
    ),
    (
        v_venta_id,
        'COMPROBANTE_EMITIDO',
        'Boleta B001-' || v_secuencia_num || ' emitida (Simulación controlada sin alteración SUNAT)',
        'PAGADA',
        'EMITIDA',
        jsonb_build_object('comprobante', 'B001-' || v_secuencia_num)
    );

    IF v_origen_id IS NOT NULL THEN
        INSERT INTO public.historial_ventas (
            venta_id,
            evento,
            descripcion,
            metadata
        )
        VALUES (
            v_origen_id,
            'OPERACION_RELACIONADA',
            'Se creó la operación vinculada ' || v_codigo_venta || ' para agregar productos adicionales',
            jsonb_build_object('venta_relacionada_id', v_venta_id, 'codigo', v_codigo_venta)
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'venta_id', v_venta_id,
        'codigo_venta', v_codigo_venta,
        'numero_venta', v_numero_venta,
        'total', v_total,
        'items_procesados', v_items_count,
        'fecha', timezone('America/Lima', now()),
        'estado', 'EMITIDA',
        'comprobante', 'B001-' || v_secuencia_num,
        'mensaje', 'Venta registrada e inventario actualizado exitosamente'
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_venta_atomica(JSONB, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
