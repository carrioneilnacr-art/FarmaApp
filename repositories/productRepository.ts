import { supabase } from '../services/supabase';
import { Producto, ProductoConCategoria } from '../types/database';

export const productRepository = {
  /**
   * Obtener todos los productos activos con sus categorías
   */
  async getAllProducts(limit: number = 50): Promise<ProductoConCategoria[]> {
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias(*)')
      .eq('activo', true)
      .order('nombre', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(error.message);
    }

    return (data as unknown as ProductoConCategoria[]) || [];
  },

  /**
   * Buscar productos por nombre o código de barras
   */
  async searchProducts(query: string, limit: number = 30): Promise<ProductoConCategoria[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return this.getAllProducts(limit);
    }

    // Buscamos si coincide con nombre o con código de barras
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias(*)')
      .eq('activo', true)
      .or(`nombre.ilike.%${cleanQuery}%,codigo_barras.ilike.%${cleanQuery}%`)
      .order('nombre', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error searching products:', error);
      throw new Error(error.message);
    }

    return (data as unknown as ProductoConCategoria[]) || [];
  },

  /**
   * Obtener un producto por su código de barras exacto
   */
  async getProductByBarcode(barcode: string): Promise<ProductoConCategoria | null> {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) return null;

    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias(*)')
      .eq('codigo_barras', cleanBarcode)
      .eq('activo', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product by barcode:', error);
      throw new Error(error.message);
    }

    return (data as unknown as ProductoConCategoria) || null;
  },

  /**
   * Obtener un producto por ID
   */
  async getProductById(id: string): Promise<ProductoConCategoria | null> {
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product by ID:', error);
      throw new Error(error.message);
    }

    return (data as unknown as ProductoConCategoria) || null;
  },
};
