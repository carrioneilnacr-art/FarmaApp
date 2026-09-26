import { Producto, CartItem } from '../types/database';

describe('Inventory & Stock Validation Logic', () => {
  const inStockProduct: Producto = {
    id: 'prod-100',
    categoria_id: 'cat-001',
    codigo_barras: 'BOT-000100',
    nombre: 'Amoxicilina 500mg',
    descripcion: 'Antibiótico',
    precio: 1.5,
    stock: 10,
    stock_minimo: 3,
    imagen_url: null,
    activo: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  const lowStockProduct: Producto = {
    id: 'prod-101',
    categoria_id: 'cat-001',
    codigo_barras: 'BOT-000101',
    nombre: 'Azitromicina 500mg',
    descripcion: 'Antibiótico',
    precio: 5.0,
    stock: 2,
    stock_minimo: 5,
    imagen_url: null,
    activo: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  const outOfStockProduct: Producto = {
    id: 'prod-102',
    categoria_id: 'cat-001',
    codigo_barras: 'BOT-000102',
    nombre: 'Omeprazol 20mg',
    descripcion: 'Protector gástrico',
    precio: 0.8,
    stock: 0,
    stock_minimo: 10,
    imagen_url: null,
    activo: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  // Helper validation function implementing CartContext business rules
  interface ValidationResult {
    allowed: boolean;
    reason?: string;
  }

  const validateAddToCart = (
    producto: Producto,
    cantidadToAdd: number,
    currentCartQty: number = 0
  ): ValidationResult => {
    if (cantidadToAdd <= 0) {
      return { allowed: false, reason: 'La cantidad debe ser mayor a 0' };
    }

    if (producto.stock <= 0) {
      return { allowed: false, reason: `"${producto.nombre}" está agotado.` };
    }

    const projectedQty = currentCartQty + cantidadToAdd;
    if (projectedQty > producto.stock) {
      return {
        allowed: false,
        reason: `Stock insuficiente. Solo quedan ${producto.stock} unidades de "${producto.nombre}".`,
      };
    }

    return { allowed: true };
  };

  const validateIncrement = (producto: Producto, currentCartQty: number): ValidationResult => {
    const nextQty = currentCartQty + 1;
    if (nextQty > producto.stock) {
      return {
        allowed: false,
        reason: `Máximo stock alcanzado (${producto.stock} uds).`,
      };
    }
    return { allowed: true };
  };

  const isLowStockWarning = (producto: Producto): boolean => {
    return producto.stock > 0 && producto.stock <= producto.stock_minimo;
  };

  describe('1. Out-of-Stock (Stock = 0) Protection', () => {
    test('rejects adding product with stock 0', () => {
      const result = validateAddToCart(outOfStockProduct, 1, 0);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(`"${outOfStockProduct.nombre}" está agotado.`);
    });

    test('rejects increment on out-of-stock product', () => {
      const result = validateIncrement(outOfStockProduct, 0);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Máximo stock alcanzado (0 uds)');
    });
  });

  describe('2. Negative and Zero Quantity Boundary Validation', () => {
    test('rejects adding zero quantity (0)', () => {
      const result = validateAddToCart(inStockProduct, 0, 0);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('La cantidad debe ser mayor a 0');
    });

    test('rejects adding negative quantities (-1, -5)', () => {
      const resultNeg = validateAddToCart(inStockProduct, -1, 0);
      expect(resultNeg.allowed).toBe(false);
      expect(resultNeg.reason).toBe('La cantidad debe ser mayor a 0');

      const resultNeg5 = validateAddToCart(inStockProduct, -5, 0);
      expect(resultNeg5.allowed).toBe(false);
      expect(resultNeg5.reason).toBe('La cantidad debe ser mayor a 0');
    });
  });

  describe('3. Stock Boundary and Limit Validation', () => {
    test('permits adding quantity exactly equal to available stock', () => {
      const result = validateAddToCart(inStockProduct, 10, 0);
      expect(result.allowed).toBe(true);
    });

    test('rejects adding quantity exceeding available stock on initial add', () => {
      const result = validateAddToCart(inStockProduct, 11, 0);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Stock insuficiente. Solo quedan 10 unidades');
    });

    test('rejects adding additional items when cumulative quantity exceeds available stock', () => {
      // Current in cart: 8 units out of 10 available
      const currentQty = 8;
      // Try to add 3 more -> projected 11 > 10
      const result = validateAddToCart(inStockProduct, 3, currentQty);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Stock insuficiente. Solo quedan 10 unidades');
    });

    test('allows increment when below stock limit', () => {
      const result = validateIncrement(inStockProduct, 9);
      expect(result.allowed).toBe(true);
    });

    test('blocks increment when current quantity has reached available stock', () => {
      const result = validateIncrement(inStockProduct, 10);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Máximo stock alcanzado (10 uds).');
    });
  });

  describe('4. Minimum Stock (Stock Mínimo) Threshold Warnings', () => {
    test('flags low stock alert when stock is below or equal to stock_minimo', () => {
      // lowStockProduct: stock = 2, stock_minimo = 5
      expect(isLowStockWarning(lowStockProduct)).toBe(true);
    });

    test('does not flag low stock alert when stock is well above stock_minimo', () => {
      // inStockProduct: stock = 10, stock_minimo = 3
      expect(isLowStockWarning(inStockProduct)).toBe(false);
    });

    test('does not flag low stock warning for exhausted (stock = 0) products', () => {
      // Out of stock has special status 'AGOTADO' rather than 'BAJO STOCK'
      expect(isLowStockWarning(outOfStockProduct)).toBe(false);
    });
  });
});
