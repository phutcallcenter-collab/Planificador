'use client';

import { useDashboardStore } from '@/store/useOperationalDashboardStore';
import ShiftCard from './ShiftCard';

export default function ShiftSummary() {
  const kpisByShift = useDashboardStore((s) => s.kpisByShift);

  const hasData = kpisByShift.some((k) => k.recibidas > 0);
  if (!hasData) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Análisis por Turno</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpisByShift.map((shiftKpis) => (
          <ShiftCard key={shiftKpis.shift} kpis={shiftKpis} />
        ))}
      </div>
    </section>
  );
}
