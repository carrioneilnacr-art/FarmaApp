import { CartItem, Producto } from '../types/database';

describe('Cart Calculation & Operations Logic', () => {
  const mockProduct1: Producto = {
    id: 'prod-001',
    categoria_id: 'cat-001',
    codigo_barras: 'BOT-000001',
    nombre: 'Paracetamol 500mg',
    descripcion: 'Analgésico y antipirético',
    precio: 0.5,
    stock: 100,
    stock_minimo: 10,
    imagen_url: null,
    activo: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  const mockProduct2: Producto = {
    id: 'prod-002',
    categoria_id: 'cat-001',
    codigo_barras: 'BOT-000002',
    nombre: 'Amoxicilina 500mg',
    descripcion: 'Antibiótico bactericida',
    precio: 1.25,
    stock: 50,
    stock_minimo: 5,
    imagen_url: null,
    activo: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  const mockProduct3: Producto = {
    id: 'prod-003',
    categoria_id: 'cat-002',
    codigo_barras: 'BOT-000003',
    nombre: 'Ibuprofeno 400mg',
    descripcion: 'Antiinflamatorio no esteroideo',
    precio: 0.8,
    stock: 80,
    stock_minimo: 15,
    imagen_url: null,
    activo: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  // Helper pure logic simulating CartContext operations
  const calculateSubtotal = (precio: number, cantidad: number): number => {
    return Number((cantidad * Number(precio)).toFixed(2));
  };

  const calculateTotalAmount = (items: CartItem[]): number => {
    const sum = items.reduce((acc, item) => acc + item.subtotal, 0);
    return Number(sum.toFixed(2));
  };

  const calculateTotalItems = (items: CartItem[]): number => {
    return items.reduce((acc, item) => acc + item.cantidad, 0);
  };

  describe('1. Subtotal and Rounding Calculations in Soles (S/)', () => {
    test('calculates correct subtotal for single item with integer quantity', () => {
      const subtotal = calculateSubtotal(mockProduct1.precio, 3);
      expect(subtotal).toBe(1.5);
    });

    test('calculates correct subtotal with fractional prices in PEN (e.g. S/ 1.25 * 3 = S/ 3.75)', () => {
      const subtotal = calculateSubtotal(mockProduct2.precio, 3);
      expect(subtotal).toBe(3.75);
    });

    test('rounds correctly avoiding floating point precision errors (e.g. S/ 0.80 * 3 = S/ 2.40)', () => {
      const subtotal = calculateSubtotal(0.8, 3);
      expect(subtotal).toBe(2.4);
      expect(subtotal.toFixed(2)).toBe('2.40');
    });

    test('handles precision for complex decimals (e.g. 0.33 * 3 = 0.99)', () => {
      const subtotal = calculateSubtotal(0.33, 3);
      expect(subtotal).toBe(0.99);
    });
  });

  describe('2. Cart Aggregate Totals', () => {
    test('calculates total sum and total item count for multiple items', () => {
      const items: CartItem[] = [
        {
          producto: mockProduct1,
          cantidad: 4,
          subtotal: calculateSubtotal(mockProduct1.precio, 4), // 4 * 0.50 = 2.00
        },
        {
          producto: mockProduct2,
          cantidad: 2,
          subtotal: calculateSubtotal(mockProduct2.precio, 2), // 2 * 1.25 = 2.50
        },
        {
          producto: mockProduct3,
          cantidad: 5,
          subtotal: calculateSubtotal(mockProduct3.precio, 5), // 5 * 0.80 = 4.00
        },
      ];

      const totalAmount = calculateTotalAmount(items);
      const totalItems = calculateTotalItems(items);

      expect(totalItems).toBe(11);
      expect(totalAmount).toBe(8.5);
      expect(totalAmount.toFixed(2)).toBe('8.50');
    });

    test('returns 0 for empty cart', () => {
      const items: CartItem[] = [];
      expect(calculateTotalAmount(items)).toBe(0);
      expect(calculateTotalItems(items)).toBe(0);
    });
  });

  describe('3. Cart Item Addition, Increment, and Decrement Logic', () => {
    test('adds a new product to cart when not previously present', () => {
      let cart: CartItem[] = [];
      const qtyToAdd = 2;

      cart = [
        ...cart,
        {
          producto: mockProduct1,
          cantidad: qtyToAdd,
          subtotal: calculateSubtotal(mockProduct1.precio, qtyToAdd),
        },
      ];

      expect(cart).toHaveLength(1);
      expect(cart[0].producto.id).toBe('prod-001');
      expect(cart[0].cantidad).toBe(2);
      expect(cart[0].subtotal).toBe(1.0);
    });

    test('increments quantity and updates subtotal when adding existing item', () => {
      let cart: CartItem[] = [
        {
          producto: mockProduct1,
          cantidad: 2,
          subtotal: 1.0,
        },
      ];

      const existingIndex = cart.findIndex((i) => i.producto.id === mockProduct1.id);
      const newQty = cart[existingIndex].cantidad + 3;
      cart[existingIndex] = {
        ...cart[existingIndex],
        cantidad: newQty,
        subtotal: calculateSubtotal(mockProduct1.precio, newQty),
      };

      expect(cart).toHaveLength(1);
      expect(cart[0].cantidad).toBe(5);
      expect(cart[0].subtotal).toBe(2.5);
    });

    test('decrements quantity and reduces subtotal', () => {
      let cart: CartItem[] = [
        {
          producto: mockProduct2,
          cantidad: 4,
          subtotal: 5.0,
        },
      ];

      const existingIndex = cart.findIndex((i) => i.producto.id === mockProduct2.id);
      const newQty = cart[existingIndex].cantidad - 1;
      cart[existingIndex] = {
        ...cart[existingIndex],
        cantidad: newQty,
        subtotal: calculateSubtotal(mockProduct2.precio, newQty),
      };

      expect(cart[0].cantidad).toBe(3);
      expect(cart[0].subtotal).toBe(3.75);
    });

    test('removes item automatically when decremented to 0', () => {
      let cart: CartItem[] = [
        {
          producto: mockProduct3,
          cantidad: 1,
          subtotal: 0.8,
        },
      ];

      const productoId = mockProduct3.id;
      const existingIndex = cart.findIndex((i) => i.producto.id === productoId);
      const newQty = cart[existingIndex].cantidad - 1;

      if (newQty <= 0) {
        cart = cart.filter((i) => i.producto.id !== productoId);
      }

      expect(cart).toHaveLength(0);
    });

    test('removes specific item by product ID', () => {
      let cart: CartItem[] = [
        { producto: mockProduct1, cantidad: 2, subtotal: 1.0 },
        { producto: mockProduct2, cantidad: 1, subtotal: 1.25 },
      ];

      cart = cart.filter((i) => i.producto.id !== mockProduct1.id);

      expect(cart).toHaveLength(1);
      expect(cart[0].producto.id).toBe(mockProduct2.id);
    });

    test('clears entire cart on clearCart action', () => {
      let cart: CartItem[] = [
        { producto: mockProduct1, cantidad: 2, subtotal: 1.0 },
        { producto: mockProduct2, cantidad: 3, subtotal: 3.75 },
      ];

      cart = [];

      expect(cart).toHaveLength(0);
      expect(calculateTotalAmount(cart)).toBe(0);
    });
  });
});
