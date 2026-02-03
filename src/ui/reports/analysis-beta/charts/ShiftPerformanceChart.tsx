'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/reports/analysis-beta/ui/card";
import { useOperationalDashboardStore } from "@/store/useOperationalDashboardStore";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNumber } from "@/domain/call-center-analysis/utils/format";

export default function ShiftPerformanceChart() {
    const { metrics, data: storeData, showPrediction } = useOperationalDashboardStore();
    const day = metrics?.kpisByShift?.Día;
    const night = metrics?.kpisByShift?.Noche;

    const getExtremes = (shift: 'DAY' | 'NIGHT') => {
        const relevant = storeData?.predictedLoad?.filter(p => p.shift === shift) || [];
        const min = relevant.reduce((sum, p) => sum + (p.minExpected || 0), 0);
        const max = relevant.reduce((sum, p) => sum + (p.maxExpected || 0), 0);
        const trend = relevant[0]?.trend || 'STABLE';
        return { min, max, trend };
    };

    const extremesDay = getExtremes('DAY');
    const extremesNight = getExtremes('NIGHT');

    const data = [
        {
            name: 'Día',
            Recibidas: day.recibidas,
            Contestadas: day.contestadas,
            Abandonadas: day.abandonadas,
            Predicción: showPrediction ? (extremesDay.min + extremesDay.max) / 2 : 0,
            range: extremesDay,
        },
        {
            name: 'Noche',
            Recibidas: night.recibidas,
            Contestadas: night.contestadas,
            Abandonadas: night.abandonadas,
            Predicción: showPrediction ? (extremesNight.min + extremesNight.max) / 2 : 0,
            range: extremesNight,
        },
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const dataItem = payload[0].payload;
            return (
                <div className="bg-white p-3 border rounded shadow-lg text-xs space-y-1">
                    <p className="font-bold border-bottom pb-1 mb-1">{label}</p>
                    {payload.map((entry: any) => (
                        <div key={entry.name} className="flex justify-between gap-4">
                            <span style={{ color: entry.fill }}>{entry.name}:</span>
                            <span className="font-mono font-bold">{formatNumber(entry.value)}</span>
                        </div>
                    ))}
                    {showPrediction && dataItem.range && (
                        <div className="mt-2 pt-2 border-t border-gray-100 italic text-indigo-600">
                            <p>Rango Teórico: {formatNumber(dataItem.range.min)} - {formatNumber(dataItem.range.max)}</p>
                            <p>Tendencia: {dataItem.range.trend === 'UP' ? '↑ Alza' : dataItem.range.trend === 'DOWN' ? '↓ Baja' : '→ Estable'}</p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Rendimiento por Turno</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="Recibidas" fill="#8884d8" name="Recibidas" />
                        <Bar dataKey="Contestadas" fill="#82ca9d" name="Contestadas" />
                        <Bar dataKey="Abandonadas" fill="#ff8042" name="Abandonadas" />
                        {showPrediction && (
                            <Bar
                                dataKey="Predicción"
                                fill="#8b5cf6"
                                fillOpacity={0.15}
                                stroke="#7c3aed"
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                name="Escenario Teórico (7d)"
                            />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
