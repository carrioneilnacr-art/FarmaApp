export type StockStatus = 'AGOTADO' | 'REPOSICION' | 'DISPONIBLE';

export function getStockStatus(stock: number, minimum: number): StockStatus {
  if (stock <= 0) return 'AGOTADO';
  return stock <= minimum ? 'REPOSICION' : 'DISPONIBLE';
}

export function estimateCoverageDays(stock: number, soldLast30Days: number): number | null {
  if (soldLast30Days <= 0) return null;
  return Math.floor((stock * 30) / soldLast30Days);
}
