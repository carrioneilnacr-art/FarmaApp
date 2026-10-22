-- Require a signed-in FarmaApp staff role for operational data.
create or replace function public.farmaapp_is_staff()
returns boolean language sql stable set search_path = public as $$
  select auth.uid() is not null
    and auth.jwt() -> 'app_metadata' ->> 'farmaapp_role' in ('administrador', 'trabajador');
$$;

drop policy if exists "Permitir lectura publica de categorias" on public.categorias;
drop policy if exists "Permitir gestion de categorias autenticados" on public.categorias;
create policy farmaapp_staff_read_categorias on public.categorias for select to authenticated using (public.farmaapp_is_staff());
create policy farmaapp_admin_manage_categorias on public.categorias for all to authenticated using (auth.jwt() -> 'app_metadata' ->> 'farmaapp_role' = 'administrador') with check (auth.jwt() -> 'app_metadata' ->> 'farmaapp_role' = 'administrador');

drop policy if exists "Permitir lectura publica de productos" on public.productos;
drop policy if exists "Permitir gestion de productos autenticados" on public.productos;
create policy farmaapp_staff_read_productos on public.productos for select to authenticated using (public.farmaapp_is_staff());
create policy farmaapp_admin_manage_productos on public.productos for all to authenticated using (auth.jwt() -> 'app_metadata' ->> 'farmaapp_role' = 'administrador') with check (auth.jwt() -> 'app_metadata' ->> 'farmaapp_role' = 'administrador');

drop policy if exists "Permitir insercion de ventas" on public.ventas;
drop policy if exists "Permitir lectura de ventas" on public.ventas;
create policy farmaapp_staff_read_ventas on public.ventas for select to authenticated using (public.farmaapp_is_staff());
create policy farmaapp_staff_insert_ventas on public.ventas for insert to authenticated with check (public.farmaapp_is_staff());

drop policy if exists "Permitir insercion de detalle_ventas" on public.detalle_ventas;
drop policy if exists "Permitir lectura de detalle_ventas" on public.detalle_ventas;
create policy farmaapp_staff_read_detalle_ventas on public.detalle_ventas for select to authenticated using (public.farmaapp_is_staff());
create policy farmaapp_staff_insert_detalle_ventas on public.detalle_ventas for insert to authenticated with check (public.farmaapp_is_staff());

drop policy if exists "Lectura pública de devoluciones" on public.devoluciones;
drop policy if exists "Lectura pública de detalle_devoluciones" on public.detalle_devoluciones;
drop policy if exists "Lectura pública de incidencias_ventas" on public.incidencias_ventas;
drop policy if exists "Lectura pública de historial_ventas" on public.historial_ventas;
drop policy if exists "Lectura pública de movimientos_stock" on public.movimientos_stock;
create policy farmaapp_staff_read_devoluciones on public.devoluciones for select to authenticated using (public.farmaapp_is_staff());
create policy farmaapp_staff_read_detalle_devoluciones on public.detalle_devoluciones for select to authenticated using (public.farmaapp_is_staff());
create policy farmaapp_staff_read_incidencias on public.incidencias_ventas for select to authenticated using (public.farmaapp_is_staff());
create policy farmaapp_staff_read_historial on public.historial_ventas for select to authenticated using (public.farmaapp_is_staff());
create policy farmaapp_staff_read_movimientos on public.movimientos_stock for select to authenticated using (public.farmaapp_is_staff());

revoke execute on function public.registrar_venta_atomica(jsonb,text,text,text) from public, anon;
revoke execute on function public.registrar_devolucion_atomica(uuid,jsonb,text) from public, anon;
revoke execute on function public.anular_venta_atomica(uuid,text,boolean) from public, anon;
revoke execute on function public.registrar_incidencia_venta(uuid,text,text) from public, anon;
revoke execute on function public.obtener_resumen_diario(date) from public, anon;
