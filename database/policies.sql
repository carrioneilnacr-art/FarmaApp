-- ==============================================================================
-- FarmaApp - Row Level Security (RLS) & Security Policies
-- Supabase Security Rules
-- ==============================================================================

-- 1. Habilitar RLS en todas las tablas del sistema
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_ventas ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. POLÍTICAS PARA: categorias
-- ==============================================================================

-- Lectura pública para anon y authenticated (Catálogo visible en POS)
DROP POLICY IF EXISTS "Permitir lectura pública de categorias" ON public.categorias;
CREATE POLICY "Permitir lectura pública de categorias"
    ON public.categorias
    FOR SELECT
    TO public
    USING (true);

-- Modificación solo para usuarios autenticados (Administradores / Personal)
DROP POLICY IF EXISTS "Permitir gestión de categorias a usuarios autenticados" ON public.categorias;
CREATE POLICY "Permitir gestión de categorias a usuarios autenticados"
    ON public.categorias
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 3. POLÍTICAS PARA: productos
-- ==============================================================================

-- Lectura pública del catálogo de medicamentos
DROP POLICY IF EXISTS "Permitir lectura pública de productos" ON public.productos;
CREATE POLICY "Permitir lectura pública de productos"
    ON public.productos
    FOR SELECT
    TO public
    USING (true);

-- Gestión de productos (crear, editar, ajustar stock directo) para autenticados
DROP POLICY IF EXISTS "Permitir gestión de productos a usuarios autenticados" ON public.productos;
CREATE POLICY "Permitir gestión de productos a usuarios autenticados"
    ON public.productos
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 4. POLÍTICAS PARA: ventas
-- ==============================================================================

-- Lectura de ventas para historial y reportes
DROP POLICY IF EXISTS "Permitir lectura de ventas" ON public.ventas;
CREATE POLICY "Permitir lectura de ventas"
    ON public.ventas
    FOR SELECT
    TO public
    USING (true);

-- Inserción de ventas directa o vía API
DROP POLICY IF EXISTS "Permitir insercion de ventas" ON public.ventas;
CREATE POLICY "Permitir insercion de ventas"
    ON public.ventas
    FOR INSERT
    TO public
    WITH CHECK (true);

-- ==============================================================================
-- 5. POLÍTICAS PARA: detalle_ventas
-- ==============================================================================

-- Lectura de detalles de venta para emisión de tickets y boletas
DROP POLICY IF EXISTS "Permitir lectura de detalle_ventas" ON public.detalle_ventas;
CREATE POLICY "Permitir lectura de detalle_ventas"
    ON public.detalle_ventas
    FOR SELECT
    TO public
    USING (true);

-- Inserción de detalles de venta
DROP POLICY IF EXISTS "Permitir insercion de detalle_ventas" ON public.detalle_ventas;
CREATE POLICY "Permitir insercion de detalle_ventas"
    ON public.detalle_ventas
    FOR INSERT
    TO public
    WITH CHECK (true);

-- ==============================================================================
-- 6. PERMISOS DE TABLAS (GRANT)
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON public.ventas, public.detalle_ventas TO anon;
