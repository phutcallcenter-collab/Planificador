'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/reports/analysis-beta/ui/card";
import { useOperationalDashboardStore } from "@/store/useOperationalDashboardStore";
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { toTimeSlot } from "@/domain/call-center-analysis/time/shiftResolver";
import { formatPercent } from "@/domain/call-center-analysis/utils/format";

export default function HourlyAbandonmentRateChart() {
    const { data } = useOperationalDashboardStore();

    const chartData = useMemo(() => {
        if (!data?.answered || !data?.abandoned?.clean) return [];

        // Get all unique time slots
        const slots = new Set<string>();
        data.answered.forEach(c => slots.add(toTimeSlot(c.hora)));
        data.abandoned.clean.forEach(c => slots.add(toTimeSlot(c.hora)));

        // Aggregate by slot (same logic as ShiftDetailTable)
        return Array.from(slots).sort().map(slot => {
            const ans = data.answered.filter(c => c.periodo === slot);
            const abn = data.abandoned.clean.filter(c => c.periodo === slot);

            const answeredCount = ans.reduce((acc, c) => acc + c.llamadas, 0);
            const total = answeredCount + abn.length;

            return {
                hour: slot,
                Rate: total > 0 ? (abn.length / total) * 100 : 0
            };
        });
    }, [data]);

    if (chartData.length === 0) return null;

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Tasa de Abandono por Hora (%)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip formatter={(value) => typeof value === 'number' ? formatPercent(value, 2) : value} />
                        <Legend />
                        <Line type="monotone" dataKey="Rate" stroke="#ff0000" />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
