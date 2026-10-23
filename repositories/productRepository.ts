import { supabase } from '../services/supabase';
import { Categoria, CategoriaInsert, ProductoConCategoria, ProductoInsert } from '../types/database';

export const productRepository = {
  async getCategories(): Promise<Categoria[]> {
    const { data, error } = await supabase.from('categorias').select('*').eq('activo', true).order('nombre', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Categoria[];
  },

  async createCategory(input: CategoriaInsert): Promise<Categoria> {
    const { data, error } = await supabase.from('categorias').insert(input as never).select('*').single();
    if (error) throw new Error(error.message.includes('duplicate') ? 'Ya existe una categoría con ese nombre.' : error.message);
    return data as Categoria;
  },

  async createProduct(input: ProductoInsert): Promise<ProductoConCategoria> {
    const { data, error } = await supabase.from('productos').insert(input as never).select('*, categorias(*)').single();
    if (error) throw new Error(error.message.includes('duplicate') ? 'Ese código de barras ya está registrado.' : error.message);
    return data as unknown as ProductoConCategoria;
  },
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
  async searchProducts(query: string, limit: number = 30, categoryId?: string): Promise<ProductoConCategoria[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery && !categoryId) {
      return this.getAllProducts(limit);
    }

    let request = supabase
      .from('productos')
      .select('*, categorias(*)')
      .eq('activo', true);
    if (categoryId) request = request.eq('categoria_id', categoryId);
    if (cleanQuery) request = request.or(`nombre.ilike.%${cleanQuery}%,codigo_barras.ilike.%${cleanQuery}%`);

    const { data, error } = await request
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
