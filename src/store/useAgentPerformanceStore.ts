import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AgentPerformanceRecord {
    agentName: string;
    validTransactions: number; // Excluyendo anuladas
    grossSales: number; // Ventas brutas (con ITBIS)
    netSales: number; // Ventas netas (sin ITBIS 18%)
    averageTicket: number; // netSales / validTransactions
    lastUpdated: string; // Fecha de última actualización
}

export interface ProcessedDate {
    date: string; // YYYY-MM-DD
    fileHash: string; // Hash del archivo para evitar duplicados
}

interface AgentPerformanceStore {
    // Datos acumulativos del mes actual
    currentMonth: string; // YYYY-MM
    agentRecords: Map<string, AgentPerformanceRecord>;
    processedDates: ProcessedDate[];

    // Actions
    processTransactions: (transactions: any[], fileDate: string) => void;
    resetMonth: () => void;
    getAgentPerformance: () => AgentPerformanceRecord[];
    getDateRange: () => { start: string, end: string } | null;
    clearAll: () => void;
}

const ITBIS_RATE = 0.18;

function calculateNetSales(grossSales: number): number {
    return grossSales / (1 + ITBIS_RATE);
}

function generateFileHash(transactions: any[]): string {
    // Simple hash basado en cantidad de transacciones y suma de valores
    const sum = transactions.reduce((acc, tx) => acc + (tx.valor || tx.monto || tx.amount || 0), 0);
    return `${transactions.length}-${sum.toFixed(2)}`;
}

export const useAgentPerformanceStore = create<AgentPerformanceStore>()(
    persist(
        (set, get) => ({
            currentMonth: '',
            agentRecords: new Map(),
            processedDates: [],

            processTransactions: (transactions, fileDate) => {
                const state = get();
                const month = fileDate.substring(0, 7); // YYYY-MM

                // VALIDACIÓN: Rechazar si es un mes diferente
                if (state.currentMonth && state.currentMonth !== month) {
                    // Notificar al usuario del error
                    if (typeof window !== 'undefined') {
                        // Usar el sistema de toast del proyecto
                        const event = new CustomEvent('show-toast', {
                            detail: {
                                title: '⚠️ Mes Diferente Detectado',
                                description: `Ya tienes datos de ${state.currentMonth}. Intentas cargar ${month}. Usa "Resetear Mes" primero.`,
                                variant: 'destructive'
                            }
                        });
                        window.dispatchEvent(event);
                    }

                    console.warn(`❌ Archivo rechazado: Mes ${month} no coincide con mes actual ${state.currentMonth}`);
                    return; // IMPORTANTE: No resetear, mantener datos existentes
                }

                // Si no hay mes actual, establecerlo
                if (!state.currentMonth) {
                    set({ currentMonth: month });
                }

                // Verificar si ya procesamos este archivo
                const fileHash = generateFileHash(transactions);
                const alreadyProcessed = state.processedDates.some(
                    pd => pd.date === fileDate && pd.fileHash === fileHash
                );

                if (alreadyProcessed) {
                    console.warn(`Archivo del ${fileDate} ya fue procesado. Ignorando duplicados.`);
                    return;
                }

                // Procesar transacciones
                const newRecords = new Map(state.agentRecords);

                transactions.forEach(tx => {
                    // Ignorar transacciones anuladas
                    if (tx.status === 'A' || tx.status === 'ANULADA') {
                        return;
                    }

                    const agentName = tx.agentName?.trim();
                    if (!agentName) return;

                    // Excluir plataformas digitales
                    const digitalPlatforms = ['AG', 'WA', 'APP', 'WEB'];
                    if (digitalPlatforms.includes(agentName.toUpperCase())) {
                        return;
                    }

                    const existing = newRecords.get(agentName) || {
                        agentName,
                        validTransactions: 0,
                        grossSales: 0,
                        netSales: 0,
                        averageTicket: 0,
                        lastUpdated: fileDate
                    };

                    // Acumular - usando 'valor' que es el campo real del Excel
                    existing.validTransactions += 1;
                    existing.grossSales += tx.valor || tx.monto || tx.amount || 0;
                    existing.netSales = calculateNetSales(existing.grossSales);
                    existing.averageTicket = existing.validTransactions > 0
                        ? existing.netSales / existing.validTransactions
                        : 0;
                    existing.lastUpdated = fileDate;

                    newRecords.set(agentName, existing);
                });

                // Guardar
                set({
                    agentRecords: newRecords,
                    processedDates: [
                        ...state.processedDates,
                        { date: fileDate, fileHash }
                    ]
                });
            },

            resetMonth: () => {
                set({
                    currentMonth: '',
                    agentRecords: new Map(),
                    processedDates: []
                });
            },

            getAgentPerformance: () => {
                const records = Array.from(get().agentRecords.values());
                return records.sort((a, b) => b.netSales - a.netSales);
            },

            getDateRange: () => {
                const dates = get().processedDates.map(pd => pd.date).sort();
                if (dates.length === 0) return null;
                return {
                    start: dates[0],
                    end: dates[dates.length - 1]
                };
            },

            clearAll: () => {
                set({
                    currentMonth: '',
                    agentRecords: new Map(),
                    processedDates: []
                });
            }
        }),
        {
            name: 'agent-performance-storage',
            // Convertir Map a objeto para persistencia
            partialize: (state) => ({
                currentMonth: state.currentMonth,
                agentRecords: Array.from(state.agentRecords.entries()),
                processedDates: state.processedDates
            }),
            onRehydrateStorage: () => (state) => {
                if (state && Array.isArray(state.agentRecords)) {
                    state.agentRecords = new Map(state.agentRecords as any);
                }
            }
        }
    )
);
