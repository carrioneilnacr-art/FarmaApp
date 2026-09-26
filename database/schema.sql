-- ==============================================================================
-- FarmaApp - Schema DDL PostgreSQL / Supabase
-- Sistema de Gestión de Farmacia y Punto de Venta (POS)
-- ==============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLA: categorias
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comentarios
COMMENT ON TABLE public.categorias IS 'Categorías terapéuticas y de clasificación de productos farmacéuticos';
COMMENT ON COLUMN public.categorias.nombre IS 'Nombre único de la categoría (ej. Analgésicos, Antibióticos)';

-- ==============================================================================
-- 2. TABLA: productos
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE RESTRICT,
    codigo_barras VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo INT NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    imagen_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comentarios
COMMENT ON TABLE public.productos IS 'Catálogo de medicamentos y suministros médicos con control de inventario';
COMMENT ON COLUMN public.productos.codigo_barras IS 'Identificador único o código de barras del producto (ej. BOT-000001)';
COMMENT ON COLUMN public.productos.precio IS 'Precio de venta al público en Soles (PEN)';
COMMENT ON COLUMN public.productos.stock IS 'Existencia actual en inventario';

-- ==============================================================================
-- 3. TABLA: ventas
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_venta VARCHAR(30) NOT NULL UNIQUE,
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    cliente_nombre VARCHAR(150),
    cliente_documento VARCHAR(20),
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO' CHECK (metodo_pago IN ('EFECTIVO', 'TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA')),
    estado VARCHAR(30) NOT NULL DEFAULT 'COMPLETADA' CHECK (estado IN ('COMPLETADA', 'ANULADA', 'PENDIENTE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comentarios
COMMENT ON TABLE public.ventas IS 'Registro de transacciones de ventas y comprobantes generados';

-- ==============================================================================
-- 4. TABLA: detalle_ventas
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.detalle_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comentarios
COMMENT ON TABLE public.detalle_ventas IS 'Detalle de los productos incluidos en cada venta';

-- ==============================================================================
-- 5. ÍNDICES PARA OPTIMIZACIÓN DE BÚSQUEDAS Y RENDIMIENTO
-- ==============================================================================

-- Búsqueda rápida por código de barras
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras 
    ON public.productos (codigo_barras);

-- Búsqueda rápida por nombre (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_productos_nombre_lower 
    ON public.productos (lower(nombre));

-- Filtrado por categoría y estado activo
CREATE INDEX IF NOT EXISTS idx_productos_categoria_activo 
    ON public.productos (categoria_id, activo);

-- Búsqueda de productos con stock bajo o alerta
CREATE INDEX IF NOT EXISTS idx_productos_stock_alerta 
    ON public.productos (stock, stock_minimo) WHERE activo = true;

-- Índices de llaves foráneas y consultas de ventas
CREATE INDEX IF NOT EXISTS idx_ventas_created_at_desc 
    ON public.ventas (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ventas_codigo_venta 
    ON public.ventas (codigo_venta);

CREATE INDEX IF NOT EXISTS idx_detalle_ventas_venta_id 
    ON public.detalle_ventas (venta_id);

CREATE INDEX IF NOT EXISTS idx_detalle_ventas_producto_id 
    ON public.detalle_ventas (producto_id);

-- ==============================================================================
-- 6. TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA DE 'updated_at'
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_categorias_updated_at ON public.categorias;
CREATE TRIGGER trigger_categorias_updated_at
    BEFORE UPDATE ON public.categorias
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_productos_updated_at ON public.productos;
CREATE TRIGGER trigger_productos_updated_at
    BEFORE UPDATE ON public.productos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
