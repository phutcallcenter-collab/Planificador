'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/reports/analysis-beta/ui/card";
import { useOperationalDashboardStore } from "@/store/useOperationalDashboardStore";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { formatCurrency } from "@/domain/call-center-analysis/utils/format";

export default function PlatformAovChart() {
    const { data } = useOperationalDashboardStore();

    const chartData = useMemo(() => {
        if (!data?.transactions) return [];
        const sales = new Map<string, number>();
        const counts = new Map<string, number>();

        data.transactions.forEach(t => {
            const p = t.plataforma || 'Otro';
            sales.set(p, (sales.get(p) || 0) + t.valor);
            counts.set(p, (counts.get(p) || 0) + 1);
        });

        return Array.from(sales.entries()).map(([name, value]) => ({
            name,
            TicketPromedio: value / (counts.get(name) || 1)
        }));
    }, [data]);

    if (chartData.length === 0) return null;

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Ticket Promedio ($) por Plataforma</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => typeof value === 'number' ? formatCurrency(value) : value} />
                        <Legend />
                        <Bar dataKey="TicketPromedio" fill="#ffc658" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
