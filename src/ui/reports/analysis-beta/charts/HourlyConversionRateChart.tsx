'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/reports/analysis-beta/ui/card";
import { useOperationalDashboardStore } from "@/store/useOperationalDashboardStore";
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { toTimeSlot } from "@/domain/call-center-analysis/time/shiftResolver";
import { formatPercent } from "@/domain/call-center-analysis/utils/format";

export default function HourlyConversionRateChart() {
    const { data } = useOperationalDashboardStore();

    const chartData = useMemo(() => {
        if (!data?.answered || !data.transactions) return [];

        // Get all unique time slots
        const slots = new Set<string>();
        data.answered.forEach(c => slots.add(toTimeSlot(c.hora)));
        data.transactions.forEach(t => t.hora && slots.add(toTimeSlot(t.hora)));

        // Aggregate by slot (same logic as ShiftDetailTable)
        return Array.from(slots).sort().map(slot => {
            const ans = data.answered.filter(c => c.periodo === slot);
            const trx = data.transactions.filter(t => t.periodo === slot);

            const answeredCount = ans.reduce((acc, c) => acc + c.llamadas, 0);

            return {
                hour: slot,
                Conversion: answeredCount > 0 ? (trx.length / answeredCount) * 100 : 0
            };
        });
    }, [data]);

    if (chartData.length === 0) return null;

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Conversión por Hora (%)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip formatter={(value) => typeof value === 'number' ? formatPercent(value, 2) : value} />
                        <Legend />
                        <Line type="monotone" dataKey="Conversion" stroke="#82ca9d" />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
