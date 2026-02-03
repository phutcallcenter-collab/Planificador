import type { Transaction } from '@/domain/operational/dashboard.types';

const PLATFORMS_ORDER = [
  'Call Center',
  'App',
  'WhatsApp',
  'Web',
  'Agregadores',
];

export function getAggregatedSales(transactions: Transaction[]) {
  const ccSales = transactions
    .filter((t) => t.plataforma === 'Call Center')
    .reduce((sum, t) => sum + t.valor, 0);
  const restSales = transactions
    .filter((t) => t.plataforma !== 'Call Center')
    .reduce((sum, t) => sum + t.valor, 0);
  return {
    labels: ['Call Center', 'Resto de plataformas'],
    values: [ccSales, restSales],
  };
}

export function getSalesByPlatform(transactions: Transaction[]) {
  const salesMap = new Map<string, number>();
  transactions.forEach((t) => {
    const p = t.plataforma || 'Sin plataforma';
    salesMap.set(p, (salesMap.get(p) || 0) + t.valor);
  });

  const labels = PLATFORMS_ORDER.filter((p) => salesMap.has(p));
  const values = labels.map((l) => salesMap.get(l)!);

  return { labels, values };
}

export function getAggregatedAov(transactions: Transaction[]) {
  const ccTransactions = transactions.filter(
    (t) => t.plataforma === 'Call Center'
  );
  const restTransactions = transactions.filter(
    (t) => t.plataforma !== 'Call Center'
  );

  const ccAov =
    ccTransactions.length > 0
      ? ccTransactions.reduce((sum, t) => sum + t.valor, 0) /
        ccTransactions.length
      : 0;
  const restAov =
    restTransactions.length > 0
      ? restTransactions.reduce((sum, t) => sum + t.valor, 0) /
        restTransactions.length
      : 0;

  return {
    labels: ['Call Center', 'Resto de plataformas'],
    values: [ccAov, restAov],
  };
}

export function getAovByPlatform(transactions: Transaction[]) {
  const sumMap = new Map<string, number>();
  const countMap = new Map<string, number>();
  transactions.forEach((t) => {
    const p = t.plataforma || 'Sin plataforma';
    sumMap.set(p, (sumMap.get(p) || 0) + t.valor);
    countMap.set(p, (countMap.get(p) || 0) + 1);
  });

  const labels = PLATFORMS_ORDER.filter((p) => countMap.has(p));
  const values = labels.map((l) => {
    const count = countMap.get(l)!;
    return count > 0 ? sumMap.get(l)! / count : 0;
  });

  return { labels, values };
}

export function getTopSucursales(transactions: Transaction[], limit = 10) {
  const countMap = new Map<string, number>();
  transactions
    .filter((t) => t.plataforma === 'Call Center')
    .forEach((t) => {
      const s = t.sucursal || 'Sin sucursal';
      countMap.set(s, (countMap.get(s) || 0) + 1);
    });

  const sorted = Array.from(countMap.entries()).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, limit);

  return {
    labels: top.map((entry) => entry[0]),
    values: top.map((entry) => entry[1]),
  };
}

export function getTransactionsByPlatform(transactions: Transaction[]) {
  const countMap = new Map<string, number>();
  transactions.forEach((t) => {
    const p = t.plataforma || 'Sin plataforma';
    countMap.set(p, (countMap.get(p) || 0) + 1);
  });

  const labels = PLATFORMS_ORDER.filter((p) => countMap.has(p));
  const values = labels.map((l) => countMap.get(l)!);

  return { labels, values };
}
