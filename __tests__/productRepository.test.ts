import { productRepository } from '../repositories/productRepository';
import { supabase } from '../services/supabase';
import { ProductoConCategoria } from '../types/database';

// Mock Supabase client
jest.mock('../services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Product Repository (productRepository)', () => {
  const mockProductsList: ProductoConCategoria[] = [
    {
      id: 'prod-001',
      categoria_id: 'cat-001',
      codigo_barras: 'BOT-000001',
      nombre: 'Paracetamol 500mg',
      descripcion: 'Analgésico',
      precio: 0.5,
      stock: 100,
      stock_minimo: 10,
      imagen_url: null,
      activo: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      categorias: {
        id: 'cat-001',
        nombre: 'Analgésicos',
        descripcion: 'Medicamentos para el dolor',
        activo: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    },
    {
      id: 'prod-002',
      categoria_id: 'cat-002',
      codigo_barras: 'BOT-000002',
      nombre: 'Amoxicilina 500mg',
      descripcion: 'Antibiótico',
      precio: 1.25,
      stock: 50,
      stock_minimo: 5,
      imagen_url: null,
      activo: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      categorias: {
        id: 'cat-002',
        nombre: 'Antibióticos',
        descripcion: 'Medicamentos antimicrobianos',
        activo: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllProducts', () => {
    test('successfully retrieves all active products', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockProductsList, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await productRepository.getAllProducts(20);

      expect(supabase.from).toHaveBeenCalledWith('productos');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*, categorias(*)');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('activo', true);
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('nombre', { ascending: true });
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20);
      expect(result).toEqual(mockProductsList);
      expect(result).toHaveLength(2);
    });

    test('throws an error if Supabase query fails', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database connection failed' } }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await expect(productRepository.getAllProducts()).rejects.toThrow('Database connection failed');
    });
  });

  describe('searchProducts', () => {
    test('delegates to getAllProducts when query string is empty or whitespace', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockProductsList, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await productRepository.searchProducts('   ', 30);

      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*, categorias(*)');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('activo', true);
      expect(result).toEqual(mockProductsList);
    });

    test('performs search query by name or barcode when query is provided', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [mockProductsList[0]], error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await productRepository.searchProducts('Paracetamol', 15);

      expect(supabase.from).toHaveBeenCalledWith('productos');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*, categorias(*)');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('activo', true);
      expect(mockQueryBuilder.or).toHaveBeenCalledWith(
        'nombre.ilike.%Paracetamol%,codigo_barras.ilike.%Paracetamol%'
      );
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('nombre', { ascending: true });
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(15);
      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('Paracetamol 500mg');
    });

    test('throws an error if search query fails', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: { message: 'Timeout in search' } }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await expect(productRepository.searchProducts('Ibuprofeno')).rejects.toThrow('Timeout in search');
    });
  });

  describe('getProductByBarcode', () => {
    test('returns null immediately when barcode is empty or whitespace', async () => {
      const result = await productRepository.getProductByBarcode('   ');
      expect(result).toBeNull();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    test('retrieves product matching the exact barcode', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockProductsList[0], error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await productRepository.getProductByBarcode('BOT-000001');

      expect(supabase.from).toHaveBeenCalledWith('productos');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*, categorias(*)');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('codigo_barras', 'BOT-000001');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('activo', true);
      expect(result).toEqual(mockProductsList[0]);
    });

    test('returns null when barcode is not found', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await productRepository.getProductByBarcode('BOT-999999');
      expect(result).toBeNull();
    });

    test('throws an error when barcode query fails', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'RLS Permission Denied' } }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await expect(productRepository.getProductByBarcode('BOT-000001')).rejects.toThrow(
        'RLS Permission Denied'
      );
    });
  });

  describe('getProductById', () => {
    test('retrieves product by id', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockProductsList[1], error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await productRepository.getProductById('prod-002');

      expect(supabase.from).toHaveBeenCalledWith('productos');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*, categorias(*)');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'prod-002');
      expect(result).toEqual(mockProductsList[1]);
    });

    test('throws an error when getProductById query fails', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found error' } }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await expect(productRepository.getProductById('invalid-id')).rejects.toThrow('Not found error');
    });
  });
});
