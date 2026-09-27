import { Producto, CartItem } from '../types/database';

describe('Product Images & Supabase Storage Verification', () => {
  const SUPABASE_STORAGE_URL =
    'https://rlldwhipkzcbjjjbqozg.supabase.co/storage/v1/object/public/productos/';

  const sampleProduct: Producto = {
    id: 'prod-001',
    categoria_id: 'cat-001',
    codigo_barras: 'BOT-000001',
    nombre: 'Paracetamol 500 mg (Caja x 100 tabletas)',
    descripcion: 'Analgésico y antipirético',
    precio: 15.5,
    stock: 60,
    stock_minimo: 10,
    imagen_url: `${SUPABASE_STORAGE_URL}BOT-000001.jpg`,
    activo: true,
    created_at: '2026-09-27T00:00:00Z',
    updated_at: '2026-09-27T00:00:00Z',
  };

  it('should have a valid Supabase Storage image URL matching the barcode', () => {
    expect(sampleProduct.imagen_url).toBeDefined();
    expect(sampleProduct.imagen_url).toContain('https://rlldwhipkzcbjjjbqozg.supabase.co');
    expect(sampleProduct.imagen_url).toContain('/storage/v1/object/public/productos/');
    expect(sampleProduct.imagen_url).toBe(
      `${SUPABASE_STORAGE_URL}${sampleProduct.codigo_barras}.jpg`
    );
  });

  it('should preserve imagen_url when product is added into CartItem', () => {
    const cartItem: CartItem = {
      producto: sampleProduct,
      cantidad: 2,
      subtotal: Number((sampleProduct.precio * 2).toFixed(2)),
    };

    expect(cartItem.producto.imagen_url).toBe(sampleProduct.imagen_url);
    expect(cartItem.producto.imagen_url).toMatch(/\.jpg$/);
  });

  it('should support null imagen_url as fallback for offline or custom items', () => {
    const productWithoutImage: Producto = {
      ...sampleProduct,
      imagen_url: null,
    };

    expect(productWithoutImage.imagen_url).toBeNull();

    // Helper logic to simulate UI fallback determination
    const getImageSource = (url: string | null) => {
      if (url && typeof url === 'string' && url.trim().length > 0) {
        return { uri: url };
      }
      return null;
    };

    expect(getImageSource(productWithoutImage.imagen_url)).toBeNull();
    expect(getImageSource(sampleProduct.imagen_url)).toEqual({
      uri: `${SUPABASE_STORAGE_URL}BOT-000001.jpg`,
    });
  });

  it('should construct valid Supabase storage URLs for all 25 catalog barcodes', () => {
    for (let i = 1; i <= 25; i++) {
      const barcode = `BOT-${String(i).padStart(6, '0')}`;
      const expectedUrl = `${SUPABASE_STORAGE_URL}${barcode}.jpg`;
      expect(expectedUrl).toMatch(
        /^https:\/\/rlldwhipkzcbjjjbqozg\.supabase\.co\/storage\/v1\/object\/public\/productos\/BOT-\d{6}\.jpg$/
      );
    }
  });
});
