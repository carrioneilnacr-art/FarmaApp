import { estimateCoverageDays, getStockStatus } from '../utils/inventory';

describe('alertas de inventario', () => {
  test('distingue agotado, reposición y disponible en el umbral', () => {
    expect(getStockStatus(0, 5)).toBe('AGOTADO');
    expect(getStockStatus(5, 5)).toBe('REPOSICION');
    expect(getStockStatus(6, 5)).toBe('DISPONIBLE');
  });

  test('cobertura basada en 30 días de ventas, sin inventar demanda', () => {
    expect(estimateCoverageDays(30, 150)).toBe(6);
    expect(estimateCoverageDays(10, 0)).toBeNull();
    expect(estimateCoverageDays(0, 10)).toBe(0);
  });
});
