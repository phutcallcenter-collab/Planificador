import { OperationalCorrelationResult } from "@/domain/call-center-analysis/correlation/correlation.types";
import { deriveSemanticStatus } from "@/domain/reporting/semantics/correlation.semantics";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { useAppStore } from "@/store/useAppStore"; // New Import

export default function OperationalHeatmap({ results }: { results: OperationalCorrelationResult[] }) {
    const requestNavigation = useAppStore(s => s.requestNavigation)
    const setDailyLogDate = useAppStore(s => s.setDailyLogDate)

    const handleNavigate = (date: string) => {
        setDailyLogDate(date)
        requestNavigation('DAILY_LOG')
    }

    // Group results by date
    const grouped = results.reduce((acc, r) => {
        if (!acc[r.date]) acc[r.date] = { date: r.date, DAY: null, NIGHT: null };
        // @ts-ignore
        acc[r.date][r.shift] = r;
        return acc;
    }, {} as Record<string, any>);

    const rows = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm">Pulso Operativo (Frecuencia)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {rows.map(row => (
                        <div
                            key={row.date}
                            className="flex flex-col items-center gap-1 group cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                            onClick={() => handleNavigate(row.date)}
                            title="Ver Detalle Diario"
                        >
                            <span className="text-[10px] text-muted-foreground font-medium group-hover:text-primary">{format(parseISO(row.date), 'dd/MM')}</span>
                            <div className="flex flex-col gap-1">
                                <HeatmapCell result={row.DAY} label="D" />
                                <HeatmapCell result={row.NIGHT} label="N" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function HeatmapCell({ result, label }: { result: OperationalCorrelationResult | null, label: string }) {
    if (!result) return <div className="w-6 h-6 bg-gray-100 rounded border border-dashed text-[8px] flex items-center justify-center text-muted-foreground opacity-50">-</div>;

    const state = deriveSemanticStatus(result.flags);
    const colors = {
        OK: 'bg-green-500',
        WATCH: 'bg-yellow-500',
        RISK: 'bg-orange-500',
        CRITICAL: 'bg-red-500',
        NO_DATA: 'bg-gray-300'
    };

    return (
        <div
            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm transition-transform group-hover/cell:scale-110 ${colors[state]}`}
            title={`${result.date} - ${result.shift}: ${state}`}
        >
            {label}
        </div>
    );
}
