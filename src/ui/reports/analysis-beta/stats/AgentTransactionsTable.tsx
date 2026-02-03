import React from 'react';
import { useOperationalDashboardStore, OperationalStore } from '@/store/useOperationalDashboardStore';
import { useAgentMappingStore } from '@/store/useAgentMappingStore';
import { useRouter } from 'next/navigation';

interface AgentTransaction {
    agentId: string;
    representante: string;
    transacciones: number;
    montoTotal: number;
    porcentajeDelTotal: number;
}

interface AgentTransactionsTableProps {
    className?: string;
}

/**
 * Agent Transactions Table - Descriptive Only
 * 
 * Rules:
 * - Only CONFIRMADO mappings
 * - Alphabetical order (never by volume/amount)
 * - No ranking, no colors, no evaluation
 * - Required disclaimer always visible
 */
export default function AgentTransactionsTable({ className = '' }: AgentTransactionsTableProps) {
    const router = useRouter();
    const { data } = useOperationalDashboardStore((state: OperationalStore) => ({
        data: state.data
    }));

    const { mappings, getStats } = useAgentMappingStore();
    const stats = getStats();

    const agentData = React.useMemo(() => {
        const transactions = data.transactions || [];

        // Get only CONFIRMADO mappings
        const confirmedMappings = mappings.filter(m => m.status === 'CONFIRMADO');

        // Create map of externalName -> agentId
        const nameToAgentId = new Map<string, string>();
        confirmedMappings.forEach(m => {
            if (m.agentId) {
                nameToAgentId.set(m.externalName, m.agentId);
            }
        });

        // Group by agentId (canonical)
        const agentMap = new Map<string, { count: number; total: number }>();

        transactions.forEach(tx => {
            if (tx.agentName) {
                const agentId = nameToAgentId.get(tx.agentName);

                // Only include if mapping is CONFIRMADO
                if (agentId) {
                    const current = agentMap.get(agentId) || { count: 0, total: 0 };
                    agentMap.set(agentId, {
                        count: current.count + 1,
                        total: current.total + (tx.valor || 0)
                    });
                }
            }
        });

        // Calculate total for percentages (only confirmed transactions)
        const totalConfirmedTransactions = Array.from(agentMap.values())
            .reduce((sum, stats) => sum + stats.count, 0);

        // Convert to array and sort alphabetically (NEVER by volume/amount)
        const agents: AgentTransaction[] = Array.from(agentMap.entries()).map(([agentId, stats]) => {
            // Get agent name from mapping
            const mapping = confirmedMappings.find(m => m.agentId === agentId);
            const agentName = mapping?.externalName || agentId;

            return {
                agentId,
                representante: agentName,
                transacciones: stats.count,
                montoTotal: stats.total,
                porcentajeDelTotal: totalConfirmedTransactions > 0
                    ? (stats.count / totalConfirmedTransactions) * 100
                    : 0
            };
        }).sort((a, b) => a.representante.localeCompare(b.representante)); // Alphabetical ONLY

        return agents;
    }, [data.transactions, mappings]);

    // Empty state: No confirmed mappings
    if (stats.confirmados === 0) {
        return (
            <div className={`bg-white p-6 rounded-lg border border-gray-300 ${className}`}>
                <div className="text-center">
                    <p className="text-gray-600 mb-2">
                        No hay transacciones vinculadas a agentes confirmados.
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                        Revisa Gestión de Identidad para asociar nombres.
                    </p>
                    <button
                        onClick={() => router.push('/admin/agent-matching')}
                        className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                    >
                        Ir a Gestión de Identidad →
                    </button>
                </div>
            </div>
        );
    }

    // Empty state: No transactions for confirmed agents
    if (agentData.length === 0) {
        return (
            <div className={`bg-white p-6 rounded-lg border border-gray-300 ${className}`}>
                <div className="text-center text-gray-500">
                    <p className="mb-2">
                        No hay transacciones para los agentes confirmados.
                    </p>
                    <p className="text-sm text-gray-400">
                        Algunas transacciones no están vinculadas a agentes confirmados.
                        Estas no se muestran aquí.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {/* Required Disclaimer (Always Visible) */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                <strong>Actividad registrada por representante.</strong> No evalúa desempeño.
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Representante
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Transacciones
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Monto Total
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                % del Total CC
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {agentData.map((agent) => (
                            <tr key={agent.agentId}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {agent.representante}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                                    {agent.transacciones.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                                    ${agent.montoTotal.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                    {agent.porcentajeDelTotal.toFixed(1)}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Unmatched transactions note (if any) */}
            {stats.pendientes > 0 && (
                <div className="mt-4 text-sm text-gray-500 text-center">
                    Algunas transacciones no están vinculadas a agentes confirmados.
                </div>
            )}
        </div>
    );
}
