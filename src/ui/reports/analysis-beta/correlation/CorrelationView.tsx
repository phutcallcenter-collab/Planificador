import { useOperationalDashboardStore } from "@/store/useOperationalDashboardStore";
import { usePlannerContext } from "@/application/ui-adapters/reporting/usePlannerContext";
import { OperationalCorrelationAdapter } from "@/domain/call-center-analysis/correlation/OperationalCorrelationAdapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/reports/analysis-beta/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/reports/analysis-beta/ui/table";
import { Badge } from "@/ui/reports/analysis-beta/ui/badge";
import { Info, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Switch } from "@/ui/reports/analysis-beta/ui/switch";
import { Label } from "@/ui/reports/analysis-beta/ui/label";
import { useState, useMemo } from "react";
import { ActualOperationalLoadBuilder } from "@/domain/call-center-analysis/builder/ActualOperationalLoadBuilder";
import { DEFAULT_THRESHOLDS } from "@/domain/reporting/thresholds/defaultThresholds";
import { deriveSemanticStatus } from "@/domain/reporting/semantics/correlation.semantics";
import SemanticBadge from "@/ui/reports/analysis-beta/semantics/SemanticBadge";
import CorrelationSummaryCard from "./CorrelationSummaryCard";
import SalesByAgentTable from "../components/SalesByAgentTable";
import OperationalHeatmap from "./OperationalHeatmap";

export default function CorrelationView() {
    const { data, scope } = useOperationalDashboardStore();
    const range = scope.range;
    const [usePresentAgents, setUsePresentAgents] = useState(true); // Default to Real (Present) Agents

    const snapshot = usePlannerContext(range);

    const actualLoad = useMemo(() => {
        if (!data) return [];
        return ActualOperationalLoadBuilder.build(
            data.answered,
            data.abandoned.raw,
            data.transactions
        );
    }, [data]);

    const correlationResults = useMemo(() => {
        if (!snapshot || actualLoad.length === 0) return [];
        // Injecting Shift-based Baselines (defaults for MVP)
        const v1Baselines = {
            DAY: { avg: 25 },
            NIGHT: { avg: 18 }
        };
        return OperationalCorrelationAdapter.correlate(
            snapshot,
            actualLoad,
            DEFAULT_THRESHOLDS,
            v1Baselines,
            usePresentAgents ? 'PRESENT' : 'PLANNED'
        );
    }, [snapshot, actualLoad, usePresentAgents]);

    // Summary logic for cards (Latest result for Day/Night)
    const latestDay = useMemo(() => correlationResults.filter(r => r.shift === 'DAY').slice(-1)[0], [correlationResults]);
    const latestNight = useMemo(() => correlationResults.filter(r => r.shift === 'NIGHT').slice(-1)[0], [correlationResults]);

    if (!range) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200" style={{ display: 'none' }}>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">Modo de Cálculo:</span>
                    <div className="flex items-center space-x-2">
                        <Switch id="cpa-mode" checked={usePresentAgents} onCheckedChange={setUsePresentAgents} />
                        <Label htmlFor="cpa-mode" className="text-xs font-normal">
                            Using {usePresentAgents ? "Present" : "Planned"} Agents
                            <span className="text-muted-foreground ml-1">
                                ({usePresentAgents ? "Real" : "Teórico"})
                            </span>
                        </Label>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {latestDay && (
                    <CorrelationSummaryCard
                        metricName="Carga Día (Último)"
                        value={latestDay.deltas.callsPerAgent?.toFixed(1) ?? '0'}
                        baseline="25.0"
                        deltaPct={latestDay.deltas.callsPerAgent ? ((latestDay.deltas.callsPerAgent - 25) / 25) * 100 : undefined}
                        state={deriveSemanticStatus(latestDay.flags)}
                        flags={latestDay.flags}
                    />
                )}
                {latestNight && (
                    <CorrelationSummaryCard
                        metricName="Carga Noche (Último)"
                        value={latestNight.deltas.callsPerAgent?.toFixed(1) ?? '0'}
                        baseline="18.0"
                        deltaPct={latestNight.deltas.callsPerAgent ? ((latestNight.deltas.callsPerAgent - 18) / 18) * 100 : undefined}
                        state={deriveSemanticStatus(latestNight.flags)}
                        flags={latestNight.flags}
                    />
                )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800 flex items-start gap-3">
                <Info className="h-5 w-5 mt-0.5 shrink-0" />
                <div className="space-y-2">
                    <div>
                        <h4 className="font-semibold mb-1">¿Cómo se calcula esto?</h4>
                        <p>
                            La métrica principal es <strong>CPA (Llamadas Por Agente)</strong>.<br />
                            <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">CPA = Llamadas Recibidas / Agentes Planificados (Netos)</code>
                        </p>
                        <p className="mt-1 text-[10px] text-blue-600">
                            * Agentes Planificados descuenta automáticamente vacaciones, licencias y días libres.
                        </p>
                    </div>
                    {data?.predictedLoad && data.predictedLoad.length > 0 && (
                        <div className="pt-2 border-t border-blue-200">
                            <h4 className="font-semibold mb-1 flex items-center gap-1.5 grayscale opacity-70">
                                <span className="h-2 w-2 rounded-full bg-indigo-500"></span> Escenario Teórico (7d)
                            </h4>
                            <p className="text-xs opacity-80 leading-relaxed italic">
                                Este es un escenario proyectado a 7 días basado en la tendencia reciente de tus datos.
                                Diseñado para simulación de carga, no para decisiones de staffing definitivas.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-4 p-4 border rounded-lg bg-gray-50 items-center">
                <span className="text-sm font-semibold text-gray-700">Semáforo de Carga:</span>
                <div className="flex gap-3">
                    <LegendItem color="bg-green-100 text-green-700 border-green-200" label="Normal" desc="CPA < 25" />
                    <LegendItem color="bg-yellow-100 text-yellow-700 border-yellow-200" label="Atención" desc="25-35" />
                    <LegendItem color="bg-orange-100 text-orange-700 border-orange-200" label="Riesgo" desc="35-45" />
                    <LegendItem color="bg-red-100 text-red-700 border-red-200" label="Crítico" desc="> 45" />
                </div>
            </div>

            {/* 🏆 SALES ATTRIBUTION (CC-ONLY) */}
            <SalesByAgentTable />

            <OperationalHeatmap results={correlationResults} />

            <Card>
                <CardHeader>
                    <CardTitle>Auditoría: Carga Operativa vs Capacidad</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Turno</TableHead>
                                <TableHead>CPA</TableHead>
                                <TableHead>Tendencia</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Diagnóstico Humano</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {correlationResults.map((r, i) => {
                                const status = deriveSemanticStatus(r.flags);
                                const trendSignal = r.trend?.signal ?? 'STABLE';

                                return (
                                    <TableRow key={i}>
                                        <TableCell className="text-xs font-medium">
                                            {format(parseISO(r.date), 'dd MMM', { locale: es })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-[10px]">{r.shift}</Badge>
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {r.deltas.callsPerAgent?.toFixed(1)}
                                        </TableCell>
                                        <TableCell>
                                            <TrendIcon signal={trendSignal} />
                                        </TableCell>
                                        <TableCell>
                                            <SemanticBadge state={status} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {r.flags.includes('NO_PLANNED_AGENTS') ? (
                                                    <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        Sin Agentes Planificados
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        Operando con {r.expectation.plannedAgents} agentes para {r.reality.receivedCalls} llamadas.
                                                    </span>
                                                )}

                                                {r.flags.length > 0 && !r.flags.includes('NO_PLANNED_AGENTS') && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {r.flags.map(f => (
                                                            <Badge key={f} variant="outline" className="text-[10px] uppercase">
                                                                {f.replace(/_/g, ' ')}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function TrendIcon({ signal }: { signal: string }) {
    switch (signal) {
        case 'DEGRADING': return <span className="text-red-500 font-bold">📉 Empeorando</span>;
        case 'IMPROVING': return <span className="text-green-600 font-bold">📈 Mejorando</span>;
        case 'VOLATILE': return <span className="text-yellow-600">〰 Volátil</span>;
        default: return <span className="text-gray-400">─ Estable</span>;
    }
}

function LegendItem({ color, label, desc }: { color: string, label: string, desc: string }) {
    return (
        <div className={`flex flex-col px-3 py-1 rounded border ${color}`}>
            <span className="text-[10px] font-bold uppercase">{label}</span>
            <span className="text-[9px] opacity-80">{desc}</span>
        </div>
    );
}
