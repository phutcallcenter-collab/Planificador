import { SemanticState, buildNarrative } from "@/domain/reporting/semantics/correlation.semantics";
import { CorrelationFlag } from "@/domain/call-center-analysis/correlation/correlation.types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import SemanticBadge from "../semantics/SemanticBadge";

export interface CorrelationSummaryCardProps {
    metricName: string;
    value: string;
    baseline?: string;
    deltaPct?: number;
    state: SemanticState;
    flags?: CorrelationFlag[];
}

export default function CorrelationSummaryCard({
    metricName,
    value,
    baseline,
    deltaPct,
    state,
    flags = []
}: CorrelationSummaryCardProps) {
    const narrative = buildNarrative(metricName, state, deltaPct, flags);

    return (
        <Card className="overflow-hidden border-l-4" style={{
            borderLeftColor: state === 'CRITICAL' ? '#ef4444' :
                state === 'RISK' ? '#f97316' :
                    state === 'WATCH' ? '#eab308' : '#22c55e'
        }}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{metricName}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{value}</div>
                    <SemanticBadge state={state} />
                </div>

                {baseline && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Promedio: {baseline}
                        {deltaPct !== undefined && (
                            <span className={deltaPct > 0 ? 'text-red-500' : 'text-green-600'}>
                                {deltaPct > 0 ? ' (↑' : ' (↓'}{Math.abs(deltaPct).toFixed(1)}%)
                            </span>
                        )}
                    </p>
                )}

                <p className="text-[11px] mt-3 leading-relaxed opacity-80 italic">
                    "{narrative}"
                </p>
            </CardContent>
        </Card>
    );
}
