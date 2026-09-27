import { supabase } from '../services/supabase';
import {
  CartItem,
  MetodoPago,
  RegistrarVentaItemPayload,
  RegistrarVentaResponse,
  RegistrarDevolucionPayload,
  RegistrarDevolucionResponse,
  AnularVentaPayload,
  AnularVentaResponse,
  VentaCompleta,
  ResumenDiario,
  TipoIncidencia,
  EstadoVenta,
} from '../types/database';

export interface ProcessSaleParams {
  items: CartItem[];
  clienteNombre?: string;
  clienteDocumento?: string;
  metodoPago?: MetodoPago;
  ventaOrigenId?: string;
}

export const saleRepository = {
  /**
   * Procesa y registra una venta atómica a través del RPC de Supabase / PostgreSQL.
   */
  async processSale(params: ProcessSaleParams): Promise<RegistrarVentaResponse> {
    const { items, clienteNombre, clienteDocumento, metodoPago = 'EFECTIVO', ventaOrigenId } = params;

    if (!items || items.length === 0) {
      throw new Error('El carrito está vacío. Agregue productos antes de procesar la venta.');
    }

    const p_items: RegistrarVentaItemPayload[] = items.map((item) => ({
      producto_id: item.producto.id,
      cantidad: item.cantidad,
    }));

    const rpcPayload: Record<string, any> = {
      p_items,
      p_cliente_nombre: clienteNombre?.trim() || null,
      p_cliente_documento: clienteDocumento?.trim() || null,
      p_metodo_pago: metodoPago || 'EFECTIVO',
    };

    if (ventaOrigenId) {
      rpcPayload.p_items = {
        items: p_items,
        cliente_nombre: clienteNombre?.trim() || null,
        cliente_documento: clienteDocumento?.trim() || null,
        metodo_pago: metodoPago || 'EFECTIVO',
        venta_origen_id: ventaOrigenId,
      };
    }

    const { data, error } = await supabase.rpc('registrar_venta_atomica', rpcPayload as never);

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
   * Obtener las ventas recientes ordenadas cronológicamente
   */
  async getRecentSales(limit: number = 30): Promise<VentaCompleta[]> {
    const { data, error } = await supabase
      .from('ventas')
      .select('*, detalle_ventas(*, productos(*))')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent sales:', error);
      throw new Error(error.message);
    }

    return (data as unknown as VentaCompleta[]) || [];
  },

  /**
   * Buscar ventas por número de venta, código de venta o cliente
   */
  async searchSales(
    query: string,
    estadoFilter?: EstadoVenta | 'TODOS',
    limit: number = 30
  ): Promise<VentaCompleta[]> {
    const cleanQuery = query.trim();

    let req = supabase
      .from('ventas')
      .select('*, detalle_ventas(*, productos(*))');

    if (estadoFilter && estadoFilter !== 'TODOS') {
      req = req.eq('estado', estadoFilter);
    }

    if (cleanQuery) {
      req = req.or(
        `codigo_venta.ilike.%${cleanQuery}%,numero_venta.ilike.%${cleanQuery}%,cliente_nombre.ilike.%${cleanQuery}%,cliente_documento.ilike.%${cleanQuery}%`
      );
    }

    req = req.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await req;

    if (error) {
      console.error('Error searching sales:', error);
      throw new Error(error.message);
    }

    return (data as unknown as VentaCompleta[]) || [];
  },

  /**
   * Obtener el detalle completo de una venta por ID incluyendo devoluciones, historial e incidencias
   */
  async getSaleById(id: string): Promise<VentaCompleta | null> {
    const { data, error } = await supabase
      .from('ventas')
      .select(
        `
        *,
        detalle_ventas(*, productos(*)),
        devoluciones(*, detalle_devoluciones(*, productos(*))),
        incidencias_ventas(*),
        historial_ventas(*)
      `
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching sale by ID:', error);
      throw new Error(error.message);
    }

    return (data as unknown as VentaCompleta) || null;
  },

  /**
   * Registrar una devolución atómica de productos con reposición de inventario
   */
  async processDevolution(payload: RegistrarDevolucionPayload): Promise<RegistrarDevolucionResponse> {
    const { venta_id, items, motivo } = payload;

    if (!items || items.length === 0) {
      throw new Error('Debe especificar al menos un producto para la devolución');
    }

    const { data, error } = await supabase.rpc('registrar_devolucion_atomica', {
      p_venta_id: venta_id,
      p_items: items as unknown as import('../types/database').Json,
      p_motivo: motivo.trim() || 'Devolución de producto',
    } as never);

    if (error) {
      console.error('Error in registrar_devolucion_atomica RPC:', error);
      throw new Error(error.message || 'Error al procesar la devolución');
    }

    return data as unknown as RegistrarDevolucionResponse;
  },

  /**
   * Anular una venta de forma no destructiva con opción de revertir stock
   */
  async processAnnulment(payload: AnularVentaPayload): Promise<AnularVentaResponse> {
    const { venta_id, motivo, revertir_stock = true } = payload;

    const { data, error } = await supabase.rpc('anular_venta_atomica', {
      p_venta_id: venta_id,
      p_motivo: motivo.trim() || 'Anulación de venta',
      p_revertir_stock: revertir_stock,
    } as never);

    if (error) {
      console.error('Error in anular_venta_atomica RPC:', error);
      throw new Error(error.message || 'Error al anular la venta');
    }

    return data as unknown as AnularVentaResponse;
  },

  /**
   * Cancelar una venta abierta (que no ha emitido comprobante)
   */
  async cancelOpenSale(saleId: string, motivo: string = 'Venta cancelada antes del cobro'): Promise<boolean> {
    const sale = await this.getSaleById(saleId);
    if (!sale) throw new Error('Venta no encontrada');
    if (sale.estado !== 'ABIERTA') {
      throw new Error('Solo se pueden cancelar directamente ventas en estado ABIERTA');
    }

    const { error } = await supabase
      .from('ventas')
      .update({ estado: 'ANULADA', updated_at: new Date().toISOString() } as never)
      .eq('id', saleId);

    if (error) throw new Error(error.message);

    await this.registerIncident(saleId, 'ANULACION', motivo);
    return true;
  },

  /**
   * Registrar una incidencia operativa en la venta
   */
  async registerIncident(
    ventaId: string,
    tipo: TipoIncidencia,
    descripcion: string
  ): Promise<{ success: boolean; incidencia_id: string; mensaje: string }> {
    const { data, error } = await supabase.rpc('registrar_incidencia_venta', {
      p_venta_id: ventaId,
      p_tipo: tipo,
      p_descripcion: descripcion.trim(),
    } as never);

    if (error) {
      console.error('Error registering incident:', error);
      throw new Error(error.message || 'Error al registrar incidencia');
    }

    return data as unknown as { success: boolean; incidencia_id: string; mensaje: string };
  },

  /**
   * Obtener resumen diario de métricas para el dueño
   */
  async getDailySummary(fecha?: string): Promise<ResumenDiario> {
    const { data, error } = await supabase.rpc('obtener_resumen_diario', {
      p_fecha: fecha || new Date().toISOString().slice(0, 10),
    } as never);

    if (error) {
      console.error('Error fetching daily summary:', error);
      throw new Error(error.message);
    }

    return (
      (data as unknown as ResumenDiario) || {
        fecha: fecha || new Date().toISOString().slice(0, 10),
        ventas_realizadas: 0,
        total_vendido: 0,
        ventas_anuladas: 0,
        devoluciones: 0,
        productos_vendidos: 0,
        productos_devueltos: 0,
      }
    );
  },
};
