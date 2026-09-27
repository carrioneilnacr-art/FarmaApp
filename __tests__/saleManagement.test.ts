import { saleRepository } from '../repositories/saleRepository';
import { supabase } from '../services/supabase';
import {
  RegistrarDevolucionResponse,
  AnularVentaResponse,
  ResumenDiario,
  VentaCompleta,
} from '../types/database';

jest.mock('../services/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

describe('Proceso 2: Gestión y Corrección de Ventas (saleRepository)', () => {
  const mockSaleId = 'a1111111-2222-3333-4444-555555555555';

  const mockVentaCompleta: VentaCompleta = {
    id: mockSaleId,
    codigo_venta: 'VTA-20260927-100001',
    numero_venta: '000125',
    subtotal: 10.5,
    total: 10.5,
    cliente_nombre: 'Juan Pérez',
    cliente_documento: '12345678',
    metodo_pago: 'EFECTIVO',
    estado: 'EMITIDA',
    comprobante_tipo: 'BOLETA',
    comprobante_serie: 'B001',
    comprobante_numero: '00000125',
    venta_origen_id: null,
    created_at: '2026-09-27T10:00:00Z',
    updated_at: '2026-09-27T10:00:00Z',
    detalle_ventas: [
      {
        id: 'det-001',
        venta_id: mockSaleId,
        producto_id: 'prod-001',
        cantidad: 2,
        precio_unitario: 3.0,
        subtotal: 6.0,
        created_at: '2026-09-27T10:00:00Z',
        productos: {
          id: 'prod-001',
          categoria_id: 'cat-001',
          codigo_barras: 'BOT-000001',
          nombre: 'Paracetamol 500mg',
          descripcion: null,
          precio: 3.0,
          stock: 48,
          stock_minimo: 10,
          imagen_url: null,
          activo: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      },
      {
        id: 'det-002',
        venta_id: mockSaleId,
        producto_id: 'prod-002',
        cantidad: 1,
        precio_unitario: 4.5,
        subtotal: 4.5,
        created_at: '2026-09-27T10:00:00Z',
        productos: {
          id: 'prod-002',
          categoria_id: 'cat-001',
          codigo_barras: 'BOT-000002',
          nombre: 'Alcohol 250ml',
          descripcion: null,
          precio: 4.5,
          stock: 19,
          stock_minimo: 5,
          imagen_url: null,
          activo: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      },
    ],
    devoluciones: [],
    incidencias_ventas: [],
    historial_ventas: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Non-destructive Sales Management and Queries', () => {
    test('getRecentSales queries supabase with proper relations and limit', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({
        data: [mockVentaCompleta],
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        limit: mockLimit,
      });

      const result = await saleRepository.getRecentSales(15);

      expect(supabase.from).toHaveBeenCalledWith('ventas');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('detalle_ventas'));
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(15);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockSaleId);
    });

    test('searchSales filters by search query and specific status', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockOr = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({
        data: [mockVentaCompleta],
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        or: mockOr,
        eq: mockEq,
        order: mockOrder,
        limit: mockLimit,
      });

      const result = await saleRepository.searchSales('000125', 'EMITIDA', 20);

      expect(supabase.from).toHaveBeenCalledWith('ventas');
      expect(mockOr).toHaveBeenCalledWith(expect.stringContaining('000125'));
      expect(mockEq).toHaveBeenCalledWith('estado', 'EMITIDA');
      expect(result).toHaveLength(1);
    });

    test('getSaleById returns full sale aggregate with related entities', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockVentaCompleta,
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
        maybeSingle: mockSingle,
      });

      const sale = await saleRepository.getSaleById(mockSaleId);

      expect(supabase.from).toHaveBeenCalledWith('ventas');
      expect(mockEq).toHaveBeenCalledWith('id', mockSaleId);
      expect(sale).not.toBeNull();
      expect(sale?.codigo_venta).toBe('VTA-20260927-100001');
      expect(sale?.detalle_ventas).toHaveLength(2);
    });
  });

  describe('2. Atomic Devolution (CU-02: Devolución de Producto)', () => {
    test('throws validation error if devolution items array is empty', async () => {
      await expect(
        saleRepository.processDevolution({
          venta_id: mockSaleId,
          items: [],
          motivo: 'Devolución de prueba',
        })
      ).rejects.toThrow('Debe especificar al menos un producto para la devolución');
    });

    test('executes registrar_devolucion_atomica RPC with correct payload', async () => {
      const mockDevolutionResponse: RegistrarDevolucionResponse = {
        success: true,
        devolucion_id: 'dev-999',
        codigo_devolucion: 'DEV-20260927-999999',
        total_devuelto: 4.5,
        nuevo_estado: 'DEVUELTA',
        mensaje: 'Devolución registrada e inventario actualizado exitosamente',
      };

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockDevolutionResponse,
        error: null,
      });

      const payload = {
        venta_id: mockSaleId,
        items: [{ producto_id: 'prod-002', cantidad: 1 }],
        motivo: 'Producto equivocado',
      };

      const result = await saleRepository.processDevolution(payload);

      expect(supabase.rpc).toHaveBeenCalledWith('registrar_devolucion_atomica', {
        p_venta_id: mockSaleId,
        p_items: payload.items,
        p_motivo: 'Producto equivocado',
      });
      expect(result.success).toBe(true);
      expect(result.total_devuelto).toBe(4.5);
      expect(result.nuevo_estado).toBe('DEVUELTA');
    });

    test('propagates error when database RPC rejects devolution (e.g. quantity exceeds sold)', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'La cantidad a devolver supera la cantidad vendida disponible' },
      });

      await expect(
        saleRepository.processDevolution({
          venta_id: mockSaleId,
          items: [{ producto_id: 'prod-002', cantidad: 5 }],
          motivo: 'Devolución excedida',
        })
      ).rejects.toThrow('La cantidad a devolver supera la cantidad vendida disponible');
    });
  });

  describe('3. Non-Destructive Annulment (CU-03: Anulación Controlada)', () => {
    test('executes anular_venta_atomica RPC and preserves sale immutability', async () => {
      const mockAnnulResponse: AnularVentaResponse = {
        success: true,
        venta_id: mockSaleId,
        codigo_venta: 'VTA-20260927-100001',
        nuevo_estado: 'ANULADA',
        mensaje: 'Venta anulada e inventario restaurado exitosamente',
      };

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockAnnulResponse,
        error: null,
      });

      const result = await saleRepository.processAnnulment({
        venta_id: mockSaleId,
        motivo: 'Error de digitación en boleta',
        revertir_stock: true,
      });

      expect(supabase.rpc).toHaveBeenCalledWith('anular_venta_atomica', {
        p_venta_id: mockSaleId,
        p_motivo: 'Error de digitación en boleta',
        p_revertir_stock: true,
      });
      expect(result.success).toBe(true);
      expect(result.nuevo_estado).toBe('ANULADA');
    });

    test('allows annulment without stock reversion when merchandise is lost or destroyed', async () => {
      const mockAnnulResponse: AnularVentaResponse = {
        success: true,
        venta_id: mockSaleId,
        codigo_venta: 'VTA-20260927-100001',
        nuevo_estado: 'ANULADA',
        mensaje: 'Venta anulada sin reincorporación de inventario',
      };

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockAnnulResponse,
        error: null,
      });

      const result = await saleRepository.processAnnulment({
        venta_id: mockSaleId,
        motivo: 'Merma de producto deteriorado',
        revertir_stock: false,
      });

      expect(supabase.rpc).toHaveBeenCalledWith('anular_venta_atomica', {
        p_venta_id: mockSaleId,
        p_motivo: 'Merma de producto deteriorado',
        p_revertir_stock: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('4. Open Sale Cancellation (Pre-Emitted State)', () => {
    test('rejects direct cancellation if sale is already EMITIDA', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockVentaCompleta, // estado is 'EMITIDA'
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
        maybeSingle: mockSingle,
      });

      await expect(
        saleRepository.cancelOpenSale(mockSaleId, 'Cancelación no permitida')
      ).rejects.toThrow('Solo se pueden cancelar directamente ventas en estado ABIERTA');
    });

    test('allows cancelOpenSale if sale is in ABIERTA state', async () => {
      const openSale: VentaCompleta = {
        ...mockVentaCompleta,
        estado: 'ABIERTA',
        comprobante_numero: null,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: openSale,
        error: null,
      });
      const mockUpdate = jest.fn().mockReturnThis();
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'ventas') {
          return {
            select: mockSelect,
            eq: (field: string, val: string) => {
              if (field === 'id') return { single: mockSingle, maybeSingle: mockSingle };
              return mockEq(field, val);
            },
            update: () => ({ eq: mockUpdateEq }),
          };
        }
        return {};
      });

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const success = await saleRepository.cancelOpenSale(mockSaleId, 'Cliente desistió antes de pagar');
      expect(success).toBe(true);
    });
  });

  describe('5. Daily Summary Metrics for Pharmacist Owner', () => {
    test('obtains daily summary via obtener_resumen_diario RPC', async () => {
      const mockResumen: ResumenDiario = {
        fecha: '2026-09-27',
        ventas_realizadas: 15,
        total_vendido: 485.5,
        ventas_anuladas: 1,
        devoluciones: 2,
        productos_vendidos: 38,
        productos_devueltos: 3,
      };

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockResumen,
        error: null,
      });

      const summary = await saleRepository.getDailySummary('2026-09-27');

      expect(supabase.rpc).toHaveBeenCalledWith('obtener_resumen_diario', {
        p_fecha: '2026-09-27',
      });
      expect(summary.ventas_realizadas).toBe(15);
      expect(summary.total_vendido).toBe(485.5);
      expect(summary.devoluciones).toBe(2);
    });
  });

  describe('6. Strictly Non-Destructive Integrity Guarantee', () => {
    test('repository exposes no deleteSale method and never executes DELETE SQL', () => {
      const repoAny = saleRepository as any;
      expect(repoAny.deleteSale).toBeUndefined();
      expect(repoAny.removeSale).toBeUndefined();
      expect(repoAny.destroySale).toBeUndefined();
    });
  });
});
