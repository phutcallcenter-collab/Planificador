import type {
  AnsweredCall,
  AbandonedCall,
  Transaction,
  KPIs,
  Shift,
  ShiftKPIs,
  TimeSlotKpi,
} from '@/domain/call-center-analysis/dashboard.types';
import { getShift } from './shift.service';

export function calculateGlobalKpis(
  answeredCalls: AnsweredCall[],
  abandonedCalls: AbandonedCall[], // Cleaned list
  transactions: Transaction[]
): KPIs {
  const contestadas = answeredCalls.reduce(
    (sum, call) => sum + call.llamadas,
    0
  );
  const abandonadas = abandonedCalls.length;
  const recibidas = contestadas + abandonadas;

  const nivelDeServicio = recibidas > 0 ? (contestadas / recibidas) * 100 : 0;
  const transaccionesCC = transactions.filter(
    (t) => t.plataforma === 'Call Center'
  ).length;
  const conversion =
    contestadas > 0 ? (transaccionesCC / contestadas) * 100 : 0;

  return {
    recibidas,
    contestadas,
    abandonadas,
    nivelDeServicio,
    conversion,
    transaccionesCC,
    abandonoPct: recibidas > 0 ? (abandonadas / recibidas) * 100 : 0,
  };
}

export function calculateKPIsByShift(
  answered: AnsweredCall[],
  rawAbandoned: AbandonedCall[],
  transactions: Transaction[]
): { Día: ShiftKPIs; Noche: ShiftKPIs } {
  const shifts: Shift[] = ['Día', 'Noche'];
  const result: { Día: ShiftKPIs; Noche: ShiftKPIs } = {
    Día: {} as ShiftKPIs,
    Noche: {} as ShiftKPIs,
  };

  shifts.forEach((shift) => {
    // ... filtering logic ...
    const answeredInShift = answered.filter((call) => call.turno === shift);
    const abandonedInShift = rawAbandoned.filter((call) => call.turno === shift);
    const transactionsInShift = transactions.filter(
      (tx) => getShift(tx.hora) === shift
    );

    const contestadas = answeredInShift.reduce(
      (sum, call) => sum + call.llamadas,
      0
    );
    // ... calculations ...

    // RE-INSTATE logic but fix assignment

    const abandonadasLimpias = abandonedInShift.filter(
      (c) => !c.isDuplicate && !c.isLT20
    ).length;
    const recibidas = contestadas + abandonadasLimpias;
    const atencion = recibidas > 0 ? (contestadas / recibidas) * 100 : 0;

    const trans = transactionsInShift.filter(
      (t) => t.plataforma === 'Call Center'
    ).length;
    const conv = contestadas > 0 ? (trans / contestadas) * 100 : 0;

    // Safe assignment using the loop variable typed as keyof typeof result
    result[shift] = {
      recibidas: recibidas,
      contestadas: contestadas,
      trans: trans,
      conv: conv,
      abandonadas: abandonadasLimpias,
      duplicadas: abandonedInShift.filter((c) => c.isDuplicate).length,
      lt20: abandonedInShift.filter((c) => !c.isDuplicate && c.isLT20).length,
      atencion: atencion,
      abandonoPct: recibidas > 0 ? (abandonadasLimpias / recibidas) * 100 : 0,
    };
  });

  return result;
}

function periodo30(hhmmss: string): string {
  if (!hhmmss) return '00:00';
  const [hh, mm] = hhmmss.split(':').map(Number);
  return mm < 30
    ? `${String(hh).padStart(2, '0')}:00`
    : `${String(hh).padStart(2, '0')}:30`;
}

export function aggregateByTimeSlot(
  answered: AnsweredCall[],
  abandoned: AbandonedCall[], // Clean list
  transactions: Transaction[]
): { day: TimeSlotKpi[]; night: TimeSlotKpi[] } {
  const agg = new Map<
    string,
    {
      c: number;
      connSum: number;
      w: number;
      a: number;
      aConnSum: number;
      t: number;
    }
  >();

  const bucket = (slot: string) => {
    if (!agg.has(slot)) {
      agg.set(slot, { c: 0, connSum: 0, w: 0, a: 0, aConnSum: 0, t: 0 });
    }
    return agg.get(slot)!;
  };

  answered.forEach((call) => {
    const slot = call.periodo
      ? call.periodo.split('-')[0].trim()
      : periodo30(call.hora);
    const b = bucket(slot);
    b.c += call.llamadas;
    b.connSum += call.conexion;
    b.w += call.llamadas;
  });

  abandoned.forEach((call) => {
    const slot = call.periodo; // Already in HH:MM format from parser
    const b = bucket(slot);
    b.a += 1;
    b.aConnSum += call.conexion;
  });

  transactions.forEach((tx) => {
    if (tx.plataforma === 'Call Center') {
      const slot = periodo30(tx.hora);
      const b = bucket(slot);
      b.t += 1;
    }
  });

  const daySlots = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
  ];
  const nightSlots: string[] = [];
  for (let h = 16; h < 24; h++) {
    nightSlots.push(String(h).padStart(2, '0') + ':00');
    nightSlots.push(String(h).padStart(2, '0') + ':30');
  }

  const row = (slot: string): TimeSlotKpi => {
    const x =
      agg.get(slot) || { c: 0, connSum: 0, w: 0, a: 0, aConnSum: 0, t: 0 };
    const contestadas = x.c;
    const abandonadas = x.a;
    const recibidas = contestadas + abandonadas;
    const pctAtencion = recibidas > 0 ? (contestadas / recibidas) * 100 : 0;
    const pctAband = recibidas > 0 ? (abandonadas / recibidas) * 100 : 0;

    const conexionAvg = x.w > 0 ? x.connSum / x.w : 0;
    const abandAvg = abandonadas > 0 ? x.aConnSum / abandonadas : 0;

    const transactionsInSlot = x.t;
    const conversionRate =
      contestadas > 0 ? (transactionsInSlot / contestadas) * 100 : 0;

    return {
      hora: slot,
      recibidas,
      contestadas,
      conexionSum: x.connSum,
      conexionAvg: conexionAvg,
      pctAtencion,
      abandonadas,
      abandConnSum: x.aConnSum,
      abandAvg: abandAvg,
      pctAband,
      conversionRate,
    };
  };

  const day = daySlots.map(row);
  const night = nightSlots.map(row);

  return { day, night };
}

export const KPIService = {
  calculateKPIs: calculateGlobalKpis,
  calculateKPIsByShift: calculateKPIsByShift,
  aggregateByTimeSlot: aggregateByTimeSlot
};
