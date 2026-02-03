import type { Transaction } from '@/domain/operational/dashboard.types';

export type AuditData = {
  dateRange: string;
  validRecords: number;
  totalRecords: number;
  byStatus: Record<string, number>;
  byPlatform: Record<string, number>;
  byCanalReal: Record<string, number>;
  totalValue: number;
  globalAov: number;
  aovByPlatform: Record<string, number>;
};

export function calculateAuditData(
  rawTransactions: Transaction[],
  validTransactions: Transaction[]
): AuditData {
  if (rawTransactions.length === 0) {
    return {
      dateRange: '-',
      validRecords: 0,
      totalRecords: 0,
      byStatus: {},
      byPlatform: {},
      byCanalReal: {},
      totalValue: 0,
      globalAov: 0,
      aovByPlatform: {},
    };
  }

  const dates = validTransactions
    .map((t) => (t.fecha ? new Date(t.fecha) : null))
    .filter((d): d is Date => d !== null && !isNaN(d.getTime()));

  let dateRange = '-';
  if (dates.length > 0) {
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    dateRange = `${min.toISOString().slice(0, 10)} a ${max
      .toISOString()
      .slice(0, 10)}`;
  }

  const byStatus: Record<string, number> = {};
  rawTransactions.forEach((t) => {
    const status = t.estatus || '-';
    byStatus[status] = (byStatus[status] || 0) + 1;
  });

  const byPlatform: Record<string, number> = {};
  const byCanalReal: Record<string, number> = {};
  validTransactions.forEach((t) => {
    const platform = t.plataforma || 'Sin plataforma';
    byPlatform[platform] = (byPlatform[platform] || 0) + 1;
    const canal = t.canalReal || 'Sin canal';
    byCanalReal[canal] = (byCanalReal[canal] || 0) + 1;
  });

  const totalValue = validTransactions.reduce((sum, t) => sum + t.valor, 0);
  const globalAov =
    validTransactions.length > 0 ? totalValue / validTransactions.length : 0;

  const aovByPlatform: Record<string, number> = {};
  const platformSums: Record<string, number> = {};
  const platformCounts: Record<string, number> = {};

  validTransactions.forEach((t) => {
    const p = t.plataforma || 'Sin plataforma';
    platformSums[p] = (platformSums[p] || 0) + t.valor;
    platformCounts[p] = (platformCounts[p] || 0) + 1;
  });

  Object.keys(platformCounts).forEach((p) => {
    aovByPlatform[p] = platformSums[p] / platformCounts[p];
  });

  return {
    dateRange,
    validRecords: validTransactions.length,
    totalRecords: rawTransactions.length,
    byStatus,
    byPlatform,
    byCanalReal,
    totalValue,
    globalAov,
    aovByPlatform,
  };
}
