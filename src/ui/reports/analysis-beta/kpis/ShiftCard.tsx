'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/reports/analysis-beta/ui/card";
import { ShiftKPIs } from "@/domain/call-center-analysis/dashboard.types";
import { formatPercent } from "@/domain/call-center-analysis/utils/format";

interface ShiftCardProps {
    name: string;
    data: ShiftKPIs;
}

export default function ShiftCard({ name, data }: ShiftCardProps) {
    return (
        <Card>
            <CardHeader className="pb-4 text-center border-b bg-muted/20">
                <CardTitle className="text-lg font-bold">{name}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-y-6 gap-x-4 text-center">
                    <MetricBlock label="Recibidas" value={data.recibidas} />
                    <MetricBlock label="Contestadas" value={data.contestadas} />
                    <MetricBlock label="Transacciones" value={data.trans} />

                    <MetricBlock label="% Conversión" value={formatPercent(data.conv)} />
                    <MetricBlock label="Abandonadas" value={data.abandonadas} />
                    <MetricBlock label="Duplicadas" value={data.duplicadas} />

                    <MetricBlock label="< 20s" value={data.lt20} />
                    <MetricBlock label="% Atención" value={formatPercent(data.atencion)} />
                    <MetricBlock label="% Abandono" value={formatPercent(data.abandonoPct)} />
                </div>
            </CardContent>
        </Card>
    );
}

function MetricBlock({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex flex-col gap-1 items-center justify-center p-2 rounded-lg bg-muted/40">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
            <span className="text-xl font-bold text-foreground">{value}</span>
        </div>
    );
}
