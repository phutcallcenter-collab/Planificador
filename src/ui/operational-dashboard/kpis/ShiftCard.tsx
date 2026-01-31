import type { ShiftKPIs } from '@/domain/operational/dashboard.types';

const KPIItem = ({ title, value }: { title: string; value: string | number }) => (
  <div className="rounded-lg bg-gray-100 p-2 text-center">
    <p className="text-xs text-gray-500 truncate">{title}</p>
    <p className="text-base font-semibold">{value}</p>
  </div>
);

type ShiftCardProps = {
  name: string;
  kpis: ShiftKPIs;
};

export default function ShiftCard({ name, kpis }: ShiftCardProps) {
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <h3 className="text-lg font-semibold mb-4 text-center">{name}</h3>
      <div className="grid grid-cols-3 gap-2">
        <KPIItem title="Recibidas" value={kpis.recibidas} />
        <KPIItem title="Contestadas" value={kpis.contestadas} />
        <KPIItem title="Transacciones" value={kpis.trans} />
        <KPIItem title="% Conversión" value={formatPercent(kpis.conv)} />
        <KPIItem title="Abandonadas" value={kpis.abandonadas} />
        <KPIItem title="Duplicadas" value={kpis.duplicadas} />
        <KPIItem title="< 20s" value={kpis.lt20} />
        <KPIItem title="% Atención" value={formatPercent(kpis.atencion)} />
        <KPIItem title="% Abandono" value={formatPercent(kpis.abandonoPct)} />
      </div>
    </div>
  );
}
