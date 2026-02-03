'use client';

import React, { useEffect } from 'react';
import { useAgentPerformanceStore } from '@/store/useAgentPerformanceStore';
import { useOperationalDashboardStore } from '@/store/useOperationalDashboardStore';
import { Copy, Trash2 } from 'lucide-react';

export function AgentPerformanceTable() {
    const { data, dataDate } = useOperationalDashboardStore();
    const {
        processTransactions,
        getAgentPerformance,
        getDateRange,
        resetMonth,
        currentMonth,
        processedDates // NEW: Needed for overlap check
    } = useAgentPerformanceStore();

    const agentRecords = getAgentPerformance();

    // Procesar transacciones cuando se cargan
    useEffect(() => {
        if (data.transactions && data.transactions.length > 0) {

            // CRITICAL LOGIC: Smart Merge vs Replacement
            // 1. Get unique dates from the incoming batch
            const incomingDates = new Set(data.transactions.map(tx => tx.fecha).filter(Boolean));

            // 2. Check for ANY overlap with existing stored data
            const hasOverlap = processedDates.some(pd => incomingDates.has(pd.date));

            // 3. Decision: 
            // - If OVERLAP (e.g. reloading Jan 27, or loading Jan 1-31 after Jan 1-30): RESET first to avoid duplicates.
            // - If NO OVERLAP (e.g. loading Jan 2 after Jan 1): APPEND (do not reset).
            if (hasOverlap) {
                console.log('♻️ Overlap detected in dates. Resetting store for clean replacement.');
                resetMonth();
            }

            // Agrupar transacciones por fecha
            const transactionsByDate = new Map<string, any[]>();

            data.transactions.forEach(tx => {
                const txDate = tx.fecha; // La fecha ya viene en formato YYYY-MM-DD
                if (!txDate) return;

                if (!transactionsByDate.has(txDate)) {
                    transactionsByDate.set(txDate, []);
                }
                transactionsByDate.get(txDate)!.push(tx);
            });

            // Procesar cada grupo de fecha por separado
            transactionsByDate.forEach((transactions, date) => {
                processTransactions(transactions, date);
            });
        }
    }, [data.transactions, processTransactions]); // Remove processedDates from dep array to avoid loops, or rely on internal store stability

    const copyTableToClipboard = () => {
        const headers = ['Agente', 'Transacciones', 'Ventas Netas ($)', 'Ticket Promedio ($)'];
        const rows = agentRecords.map(record => [
            record.agentName,
            record.validTransactions.toString(),
            record.netSales.toFixed(2),
            record.averageTicket.toFixed(0)
        ]);

        const tsv = [
            headers.join('\t'),
            ...rows.map(row => row.join('\t'))
        ].join('\n');

        navigator.clipboard.writeText(tsv).then(() => {
            alert('✅ Tabla copiada al portapapeles. Puedes pegarla en Excel.');
        });
    };

    const handleResetMonth = () => {
        if (confirm('¿Estás seguro de resetear los datos del mes? Esta acción no se puede deshacer.')) {
            resetMonth();
            alert('✅ Datos reseteados correctamente.');
        }
    };

    if (agentRecords.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-8">
                <p className="text-gray-500 text-center">
                    No hay datos de rendimiento de agentes disponibles.
                </p>
                <p className="text-sm text-gray-400 text-center mt-2">
                    Carga archivos de transacciones para ver el rendimiento acumulativo.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header con controles */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        Rendimiento por Agente
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Rango de fechas: <span className="font-medium">
                            {getDateRange()
                                ? `${getDateRange()?.start} - ${getDateRange()?.end}`
                                : 'Sin datos'}
                        </span>
                        {' • '}
                        {agentRecords.length} agentes
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={copyTableToClipboard}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <Copy className="w-4 h-4" />
                        Copiar Tabla
                    </button>
                    <button
                        onClick={handleResetMonth}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Resetear Mes
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Agente
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Transacciones
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ display: 'none' }}>
                                    Ventas Brutas ($)
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ventas Netas ($)
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ticket Promedio ($)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {agentRecords.map((record, index) => (
                                <tr key={record.agentName} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {record.agentName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                        {record.validTransactions.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right" style={{ display: 'none' }}>
                                        ${record.grossSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                                        ${record.netSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                        ${Math.round(record.averageTicket).toLocaleString('en-US')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                            <tr>
                                <td colSpan={2} className="px-6 py-4 text-sm font-bold text-gray-900">
                                    TOTAL
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                    {agentRecords.reduce((sum, r) => sum + r.validTransactions, 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600 text-right" style={{ display: 'none' }}>
                                    ${agentRecords.reduce((sum, r) => sum + r.grossSales, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                    ${agentRecords.reduce((sum, r) => sum + r.netSales, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600 text-right">
                                    ${Math.round(agentRecords.reduce((sum, r) => sum + r.netSales, 0) / agentRecords.reduce((sum, r) => sum + r.validTransactions, 0)).toLocaleString('en-US')}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
