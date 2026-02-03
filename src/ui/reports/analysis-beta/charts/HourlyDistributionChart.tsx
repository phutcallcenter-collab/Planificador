'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/reports/analysis-beta/ui/card";
import { useOperationalDashboardStore } from "@/store/useOperationalDashboardStore";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { toTimeSlot } from "@/domain/call-center-analysis/time/shiftResolver";
import { formatNumber } from "@/domain/call-center-analysis/utils/format";

export default function HourlyDistributionChart() {
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

            return {
                hour: slot,
                Contestadas: answeredCount,
                Abandonadas: abn.length
            };
        });
    }, [data]);

    if (chartData.length === 0) return null;

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Distribución de Llamadas por Hora</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip formatter={(value) => typeof value === 'number' ? formatNumber(value) : value} />
                        <Legend />
                        <Area type="monotone" dataKey="Contestadas" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                        <Area type="monotone" dataKey="Abandonadas" stackId="1" stroke="#ff8042" fill="#ff8042" />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
