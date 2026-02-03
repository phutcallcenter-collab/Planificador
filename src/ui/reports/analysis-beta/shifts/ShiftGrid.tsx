'use client';

import { useOperationalDashboardStore } from "@/store/useOperationalDashboardStore";
import ShiftCard from "@/ui/reports/analysis-beta/kpis/ShiftCard";

export default function ShiftGrid() {
    const { metrics } = useOperationalDashboardStore();

    if (!metrics?.kpisByShift) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ShiftCard name="Turno Día" data={metrics.kpisByShift.Día} />
            <ShiftCard name="Turno Noche" data={metrics.kpisByShift.Noche} />
        </div>
    );
}
