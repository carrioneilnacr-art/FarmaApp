-- Existing SECURITY DEFINER routines bypass RLS. Require a staff JWT inside each one.
-- Preserve the original business logic while adding one guard at the first BEGIN.
do $$
declare
  routine record;
  definition text;
  marker text := E'\nBEGIN\n';
  position_begin integer;
begin
  for routine in
    select p.oid from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in (
        'registrar_venta_atomica', 'registrar_devolucion_atomica',
        'anular_venta_atomica', 'registrar_incidencia_venta',
        'obtener_resumen_diario'
      )
  loop
    definition := pg_get_functiondef(routine.oid);
    if position('FARMAAPP_STAFF_GUARD' in definition) > 0 then continue; end if;
    position_begin := position(marker in definition);
    if position_begin = 0 then raise exception 'Cannot locate BEGIN in %', routine.oid; end if;
    definition := overlay(definition placing
      E'\nBEGIN\n    -- FARMAAPP_STAFF_GUARD\n    IF NOT public.farmaapp_is_staff() THEN\n        RAISE EXCEPTION ''Acceso no autorizado'' USING ERRCODE = ''42501'';\n    END IF;\n'
      from position_begin for length(marker));
    execute definition;
  end loop;
end;
$$;
