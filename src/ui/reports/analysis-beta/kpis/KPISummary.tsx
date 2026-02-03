'use client';

import { useOperationalDashboardStore } from "@/store/useOperationalDashboardStore";
import KPICard from "./KPICard";
import { formatPercent } from "@/domain/call-center-analysis/utils/format";

export default function KPISummary() {
    const { metrics } = useOperationalDashboardStore();
    const kpis = metrics?.kpis;

    if (!kpis) return null;

    return (

        <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
            <KPICard title="Total Recibidas" value={kpis.recibidas} />
            <KPICard title="Total Contestadas" value={kpis.contestadas} highlight />
            <KPICard
                title="Total Abandonadas"
                value={kpis.abandonadas}
                color={kpis.abandonadas > 0 ? "text-red-500" : "text-green-600"}
            />
            <KPICard
                title="% Atención"
                value={formatPercent(kpis.nivelDeServicio)}
                color={kpis.nivelDeServicio > 0.9 ? "text-green-600" : "text-yellow-600"}
            />
            <KPICard
                title="% Abandono"
                value={formatPercent(kpis.abandonoPct)}
                color={kpis.abandonoPct < 0.05 ? "text-green-600" : "text-red-500"}
            />
            <KPICard title="Transacciones CC" value={kpis.transaccionesCC} />
            <KPICard title="% Conversión" value={formatPercent(kpis.conversion)} />
        </div>
    );
}
