'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/reports/analysis-beta/ui/card";
import { useOperationalDashboardStore } from "@/store/useOperationalDashboardStore";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { formatNumber } from "@/domain/call-center-analysis/utils/format";

export default function PlatformTransactionsChart() {
    const { data } = useOperationalDashboardStore();

    const chartData = useMemo(() => {
        if (!data?.transactions) return [];
        const platforms = new Map<string, number>();

        data.transactions.forEach(t => {
            const p = t.plataforma || 'Otro';
            platforms.set(p, (platforms.get(p) || 0) + 1);
        });

        return Array.from(platforms.entries()).map(([name, value]) => ({ name, Transacciones: value }));
    }, [data]);

    if (chartData.length === 0) return null;

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Transacciones por Plataforma</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => typeof value === 'number' ? formatNumber(value) : value} />
                        <Legend />
                        <Bar dataKey="Transacciones" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
