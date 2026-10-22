import { supabase } from '../services/supabase';
import { ProductoConCategoria } from '../types/database';

export interface RecentStockMovement {
  id: string;
  producto_id: string;
  tipo: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo: string | null;
  created_at: string;
}

export interface InventorySnapshot {
  products: ProductoConCategoria[];
  soldLast30Days: Record<string, number>;
  salesHistoryAvailable: boolean;
}

export const inventoryRepository = {
  async getSnapshot(): Promise<InventorySnapshot> {
    const products: ProductoConCategoria[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase
        .from('productos')
        .select('*, categorias(*)')
        .eq('activo', true)
        .order('id', { ascending: true })
        .range(offset, offset + 499);
      if (error) throw new Error(error.message);
      const rows = (data || []) as unknown as ProductoConCategoria[];
      products.push(...rows);
      if (rows.length < 500) break;
    }
    products.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const soldLast30Days: Record<string, number> = {};
    let salesHistoryAvailable = true;
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase
        .from('movimientos_stock')
        .select('producto_id,cantidad')
        .eq('tipo', 'VENTA')
        .gte('created_at', since)
        .order('id', { ascending: true })
        .range(offset, offset + 499);
      if (error) {
        salesHistoryAvailable = false;
        break;
      }
      const rows = data as unknown as Pick<RecentStockMovement, 'producto_id' | 'cantidad'>[] | null;
      for (const movement of rows || []) {
        soldLast30Days[movement.producto_id] =
          (soldLast30Days[movement.producto_id] || 0) + movement.cantidad;
      }
      if (!rows || rows.length < 500) break;
    }

    return { products, soldLast30Days, salesHistoryAvailable };
  },

  async getRecentMovements(productId: string): Promise<RecentStockMovement[]> {
    const { data, error } = await supabase
      .from('movimientos_stock')
      .select('id,producto_id,tipo,cantidad,stock_anterior,stock_nuevo,motivo,created_at')
      .eq('producto_id', productId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return (data || []) as RecentStockMovement[];
  },
};
