import React from 'react';
import { useOperationalDashboardStore, OperationalStore } from '@/store/useOperationalDashboardStore';

interface CallCenterVolumeCardsProps {
    className?: string;
}

export default function CallCenterVolumeCards({ className = '' }: CallCenterVolumeCardsProps) {
    const { data } = useOperationalDashboardStore((state: OperationalStore) => ({
        data: state.data
    }));

    // Calculate CC metrics
    const metrics = React.useMemo(() => {
        const answered = data.answered || [];
        const abandoned = data.abandoned?.clean || [];
        const transactions = data.transactions || [];

        // Total calls received (answered + abandoned)
        const totalReceived = answered.reduce((sum: number, call) => sum + call.llamadas, 0) +
            abandoned.length;

        // Total answered
        const totalAnswered = answered.reduce((sum: number, call) => sum + call.llamadas, 0);

        // Total abandoned
        const totalAbandoned = abandoned.length;

        // Abandonment rate
        const abandonmentRate = totalReceived > 0 ? (totalAbandoned / totalReceived) * 100 : 0;

        // Conversion rate (transactions / answered calls)
        const totalTransactions = transactions.length;
        const conversionRate = totalAnswered > 0 ? (totalTransactions / totalAnswered) * 100 : 0;

        return {
            totalReceived,
            totalAnswered,
            totalAbandoned,
            totalTransactions,
            abandonmentRate,
            conversionRate
        };
    }, [data.answered, data.abandoned, data.transactions]);

    return (
        <div className={className}>
            {/* Disclaimer */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                ℹ️ Datos exclusivos del Call Center. No incluye plataformas digitales.
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Received */}
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Llamadas Recibidas (CC)</div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {metrics.totalReceived.toLocaleString()}
                    </div>
                </div>

                {/* Answered */}
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Llamadas Contestadas (CC)</div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {metrics.totalAnswered.toLocaleString()}
                    </div>
                </div>

                {/* Abandoned */}
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Abandono (CC)</div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {metrics.abandonmentRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                        {metrics.totalAbandoned.toLocaleString()} llamadas
                    </div>
                </div>

                {/* Conversion */}
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Conversión (CC)</div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {metrics.conversionRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                        {metrics.totalTransactions.toLocaleString()} transacciones
                    </div>
                </div>
            </div>
        </div>
    );
}
