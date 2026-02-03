import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { useOperationalDashboardStore, OperationalStore } from '@/store/useOperationalDashboardStore';
import { buildDailyVolumeSeries } from '@/domain/call-center-analysis/prediction/builders/dailyAggregationBuilder';
import { formatNumber } from '@/domain/call-center-analysis/utils/format';

interface DailyVolumeChartProps {
    className?: string;
}

export default function DailyVolumeChart({ className = '' }: DailyVolumeChartProps) {
    const { data } = useOperationalDashboardStore((state: OperationalStore) => ({
        data: state.data
    }));

    const chartData = React.useMemo(() => {
        if (!data.answered || data.answered.length === 0) {
            return [];
        }

        const dailySeries = buildDailyVolumeSeries(
            data.answered.map(call => ({
                fecha: call.fecha,
                hora: call.hora,
                llamadas: call.llamadas,
                turno: call.turno
            }))
        );

        // Format for chart: convert date to readable format
        return dailySeries.map(day => ({
            date: day.date,
            displayDate: formatDate(day.date),
            volume: day.volume
        }));
    }, [data.answered]);

    if (chartData.length === 0) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <h3 className="text-lg font-semibold mb-4">Volumen Diario</h3>
                <div className="flex items-center justify-center h-64 text-gray-400">
                    No hay datos disponibles
                </div>
            </div>
        );
    }

    const avgVolume = chartData.reduce((sum, d) => sum + d.volume, 0) / chartData.length;

    return (
        <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Volumen Diario</h3>
                <p className="text-sm text-gray-500">
                    Llamadas contestadas por día • Promedio: {formatNumber(Math.round(avgVolume))}
                </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 12 }}
                        stroke="#94a3b8"
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#94a3b8"
                        tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px'
                        }}
                        formatter={(value: number | undefined) => value ? [formatNumber(value), 'Llamadas'] : ['0', 'Llamadas']}
                        labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="volume"
                        name="Volumen"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// Helper: Format date for display
function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
}
