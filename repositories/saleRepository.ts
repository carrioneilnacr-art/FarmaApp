import { supabase } from '../services/supabase';
import { CartItem, MetodoPago, RegistrarVentaItemPayload, RegistrarVentaResponse } from '../types/database';

export interface ProcessSaleParams {
  items: CartItem[];
  clienteNombre?: string;
  clienteDocumento?: string;
  metodoPago?: MetodoPago;
}

export const saleRepository = {
  /**
   * Procesa y registra una venta atómica a través del RPC de Supabase / PostgreSQL.
   * Ejecuta la transacción ACID: validación de stock con bloqueo FOR UPDATE,
   * inserción de venta, inserción de detalle y descuento de inventario.
   */
  async processSale(params: ProcessSaleParams): Promise<RegistrarVentaResponse> {
    const { items, clienteNombre, clienteDocumento, metodoPago = 'EFECTIVO' } = params;

    if (!items || items.length === 0) {
      throw new Error('El carrito está vacío. Agregue productos antes de procesar la venta.');
    }

    // Mapear los items al payload requerido por el RPC
    const p_items: RegistrarVentaItemPayload[] = items.map((item) => ({
      producto_id: item.producto.id,
      cantidad: item.cantidad,
    }));

    const { data, error } = await supabase.rpc('registrar_venta_atomica', {
      p_items: p_items as unknown as import('../types/database').Json,
      p_cliente_nombre: clienteNombre?.trim() || null,
      p_cliente_documento: clienteDocumento?.trim() || null,
      p_metodo_pago: metodoPago || 'EFECTIVO',
    } as never);

    if (error) {
      console.error('Error invoking registrar_venta_atomica RPC:', error);
      throw new Error(error.message || 'Error al procesar la venta en el servidor');
    }

    if (!data) {
      throw new Error('No se recibió respuesta del servidor de base de datos.');
    }

    return data as unknown as RegistrarVentaResponse;
  },

  /**
   * Obtener las últimas ventas registradas (opcional para historial / métricas rápidas)
   */
  async getRecentSales(limit: number = 10) {
    const { data, error } = await supabase
      .from('ventas')
      .select('*, detalle_ventas(*, productos(*))')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent sales:', error);
      throw new Error(error.message);
    }

    return data || [];
  },
};
