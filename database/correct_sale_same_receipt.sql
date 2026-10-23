-- Corrige los productos de una venta sin cambiar su ID, número, cliente ni comprobante.
-- Guarda una fotografía antes/después en historial_ventas y ajusta stock de forma atómica.
create or replace function public.corregir_venta_atomica(
  p_venta_id uuid,
  p_items jsonb,
  p_motivo text default 'Corrección solicitada por el cliente'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_venta public.ventas%rowtype;
  v_row record;
  v_producto public.productos%rowtype;
  v_items jsonb;
  v_antes jsonb;
  v_despues jsonb;
  v_total numeric(10,2);
  v_delta integer;
  v_nuevo_stock integer;
begin
  if not public.farmaapp_is_staff() then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;

  select * into v_venta from public.ventas where id = p_venta_id for update;
  if not found then raise exception 'Venta no encontrada'; end if;
  if v_venta.estado = 'ANULADA' then raise exception 'No se puede corregir una venta anulada'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La boleta debe conservar al menos un producto. Para cancelarla use Anular venta.';
  end if;

  create temp table tmp_correccion_items(
    producto_id uuid primary key,
    cantidad integer not null check (cantidad > 0)
  ) on commit drop;

  insert into tmp_correccion_items(producto_id, cantidad)
  select (elem->>'producto_id')::uuid, sum((elem->>'cantidad')::integer)::integer
  from jsonb_array_elements(p_items) elem
  group by (elem->>'producto_id')::uuid;

  select coalesce(jsonb_agg(jsonb_build_object(
    'producto_id', d.producto_id, 'cantidad', d.cantidad,
    'precio_unitario', d.precio_unitario, 'subtotal', d.subtotal
  ) order by d.producto_id), '[]'::jsonb)
  into v_antes from public.detalle_ventas d where d.venta_id = p_venta_id;

  for v_row in
    select coalesce(d.producto_id, n.producto_id) producto_id,
           coalesce(d.cantidad, 0) cantidad_anterior,
           coalesce(n.cantidad, 0) cantidad_nueva,
           d.precio_unitario precio_anterior
    from (select * from public.detalle_ventas where venta_id = p_venta_id) d
    full join tmp_correccion_items n on n.producto_id = d.producto_id
  loop
    select * into v_producto from public.productos where id = v_row.producto_id for update;
    if not found or not v_producto.activo then
      raise exception 'Producto % no disponible', v_row.producto_id;
    end if;

    v_delta := v_row.cantidad_nueva - v_row.cantidad_anterior;
    if v_delta > 0 and v_producto.stock < v_delta then
      raise exception 'Stock insuficiente para "%". Disponible: %, adicional solicitado: %',
        v_producto.nombre, v_producto.stock, v_delta;
    end if;

    if v_delta <> 0 then
      v_nuevo_stock := v_producto.stock - v_delta;
      update public.productos set stock = v_nuevo_stock, updated_at = timezone('utc', now())
      where id = v_row.producto_id;
      insert into public.movimientos_stock(
        producto_id, tipo, cantidad, stock_anterior, stock_nuevo,
        referencia_tipo, referencia_id, motivo
      ) values (
        v_row.producto_id, 'AJUSTE', abs(v_delta), v_producto.stock, v_nuevo_stock,
        'VENTA', p_venta_id,
        case when v_delta > 0 then 'Producto agregado a la misma boleta: ' else 'Producto retirado de la misma boleta: ' end || trim(p_motivo)
      );
    end if;

    if v_row.cantidad_nueva = 0 then
      delete from public.detalle_ventas where venta_id = p_venta_id and producto_id = v_row.producto_id;
    elsif v_row.cantidad_anterior = 0 then
      insert into public.detalle_ventas(venta_id, producto_id, cantidad, precio_unitario, subtotal)
      values (p_venta_id, v_row.producto_id, v_row.cantidad_nueva, v_producto.precio,
              round(v_row.cantidad_nueva * v_producto.precio, 2));
    else
      update public.detalle_ventas
      set cantidad = v_row.cantidad_nueva,
          subtotal = round(v_row.cantidad_nueva * v_row.precio_anterior, 2)
      where venta_id = p_venta_id and producto_id = v_row.producto_id;
    end if;
  end loop;

  select coalesce(sum(subtotal), 0),
         coalesce(jsonb_agg(jsonb_build_object(
           'producto_id', producto_id, 'cantidad', cantidad,
           'precio_unitario', precio_unitario, 'subtotal', subtotal
         ) order by producto_id), '[]'::jsonb)
  into v_total, v_despues from public.detalle_ventas where venta_id = p_venta_id;

  update public.ventas
  set subtotal = v_total, total = v_total, updated_at = timezone('utc', now())
  where id = p_venta_id;

  insert into public.historial_ventas(venta_id, evento, descripcion, estado_anterior, estado_nuevo, metadata)
  values (p_venta_id, 'BOLETA_CORREGIDA', trim(p_motivo), v_venta.estado, v_venta.estado,
          jsonb_build_object('antes', v_antes, 'despues', v_despues, 'total_anterior', v_venta.total, 'total_nuevo', v_total));

  insert into public.incidencias_ventas(venta_id, tipo, descripcion, estado)
  values (p_venta_id, 'CORRECCION', 'Boleta corregida conservando el mismo ID y número. ' || trim(p_motivo), 'PROCESADA');

  return jsonb_build_object(
    'success', true, 'venta_id', v_venta.id, 'codigo_venta', v_venta.codigo_venta,
    'numero_venta', v_venta.numero_venta, 'comprobante', concat_ws('-', v_venta.comprobante_serie, v_venta.comprobante_numero),
    'total', v_total, 'cliente_nombre', v_venta.cliente_nombre, 'cliente_documento', v_venta.cliente_documento,
    'mensaje', 'La misma boleta fue actualizada correctamente'
  );
end;
$$;

revoke all on function public.corregir_venta_atomica(uuid,jsonb,text) from public, anon;
grant execute on function public.corregir_venta_atomica(uuid,jsonb,text) to authenticated;

alter function public.handle_updated_at() set search_path = public, pg_temp;
