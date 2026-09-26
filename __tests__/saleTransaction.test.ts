import { saleRepository } from '../repositories/saleRepository';
import { supabase } from '../services/supabase';
import { CartItem, RegistrarVentaResponse } from '../types/database';

jest.mock('../services/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

describe('Sale Transaction & RPC Consistency (saleRepository)', () => {
  const mockCartItems: CartItem[] = [
    {
      producto: {
        id: 'prod-001',
        categoria_id: 'cat-001',
        codigo_barras: 'BOT-000001',
        nombre: 'Paracetamol 500mg',
        descripcion: null,
        precio: 0.5,
        stock: 50,
        stock_minimo: 10,
        imagen_url: null,
        activo: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      cantidad: 4,
      subtotal: 2.0,
    },
    {
      producto: {
        id: 'prod-002',
        categoria_id: 'cat-001',
        codigo_barras: 'BOT-000002',
        nombre: 'Amoxicilina 500mg',
        descripcion: null,
        precio: 1.25,
        stock: 30,
        stock_minimo: 5,
        imagen_url: null,
        activo: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      cantidad: 2,
      subtotal: 2.5,
    },
  ];

  const mockSuccessResponse: RegistrarVentaResponse = {
    success: true,
    venta_id: 'd9b1a5e0-7c2a-4b1e-8e2a-1f8e5b4c3a21',
    codigo_venta: 'VTA-20260925-543210',
    total: 4.5,
    items_procesados: 2,
    fecha: '2026-09-25T21:00:00.000Z',
    mensaje: 'Venta registrada e inventario actualizado exitosamente',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Validation of Input Parameters and Empty Cart Check', () => {
    test('throws an error if cart items array is empty', async () => {
      await expect(
        saleRepository.processSale({
          items: [],
          clienteNombre: 'Juan Perez',
          metodoPago: 'EFECTIVO',
        })
      ).rejects.toThrow('El carrito está vacío. Agregue productos antes de procesar la venta.');

      expect(supabase.rpc).not.toHaveBeenCalled();
    });
  });

  describe('2. RPC Payload Structure & Contract Consistency', () => {
    test('maps cart items correctly and dispatches valid payload to registrar_venta_atomica RPC', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockSuccessResponse,
        error: null,
      });

      const result = await saleRepository.processSale({
        items: mockCartItems,
        clienteNombre: '  María García  ',
        clienteDocumento: '  71234567  ',
        metodoPago: 'YAPE',
      });

      expect(supabase.rpc).toHaveBeenCalledTimes(1);
      expect(supabase.rpc).toHaveBeenCalledWith('registrar_venta_atomica', {
        p_items: [
          { producto_id: 'prod-001', cantidad: 4 },
          { producto_id: 'prod-002', cantidad: 2 },
        ],
        p_cliente_nombre: 'María García',
        p_cliente_documento: '71234567',
        p_metodo_pago: 'YAPE',
      });

      expect(result).toEqual(mockSuccessResponse);
      expect(result.success).toBe(true);
      expect(result.codigo_venta).toMatch(/^VTA-\d{8}-\d{6}$/);
      expect(result.total).toBe(4.5);
      expect(result.items_procesados).toBe(2);
    });

    test('defaults metodo_pago to EFECTIVO and normalizes empty client strings to null', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockSuccessResponse,
        error: null,
      });

      await saleRepository.processSale({
        items: mockCartItems,
        clienteNombre: '',
        clienteDocumento: '   ',
      });

      expect(supabase.rpc).toHaveBeenCalledWith('registrar_venta_atomica', {
        p_items: [
          { producto_id: 'prod-001', cantidad: 4 },
          { producto_id: 'prod-002', cantidad: 2 },
        ],
        p_cliente_nombre: null,
        p_cliente_documento: null,
        p_metodo_pago: 'EFECTIVO',
      });
    });
  });

  describe('3. Error Handling and Server Exceptions', () => {
    test('handles atomic rollback error (e.g. insufficient stock from Postgres)', async () => {
      const dbErrorMessage =
        'Stock insuficiente para el producto "Paracetamol 500mg". Stock disponible: 1, solicitado: 4';

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: dbErrorMessage },
      });

      await expect(
        saleRepository.processSale({
          items: mockCartItems,
        })
      ).rejects.toThrow(dbErrorMessage);
    });

    test('throws error when server responds with empty data', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        saleRepository.processSale({
          items: mockCartItems,
        })
      ).rejects.toThrow('No se recibió respuesta del servidor de base de datos.');
    });
  });

  describe('4. getRecentSales Query Verification', () => {
    test('fetches recent sales ordered by created_at descending', async () => {
      const mockSalesData = [
        {
          id: 'vta-001',
          codigo_venta: 'VTA-20260925-111111',
          total: 12.5,
          cliente_nombre: 'Carlos Lopez',
          metodo_pago: 'EFECTIVO',
          estado: 'COMPLETADA',
          created_at: '2026-09-25T20:30:00Z',
          detalle_ventas: [],
        },
      ];

      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockSalesData, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const sales = await saleRepository.getRecentSales(5);

      expect(supabase.from).toHaveBeenCalledWith('ventas');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*, detalle_ventas(*, productos(*))');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5);
      expect(sales).toEqual(mockSalesData);
    });

    test('throws error when getRecentSales fails', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: { message: 'Network Timeout' } }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await expect(saleRepository.getRecentSales()).rejects.toThrow('Network Timeout');
    });
  });
});
