import { Transaction } from '../dashboard.types'

export interface AgentSales {
    agentName: string
    transactions: number
    totalValue: number
}

export interface SalesAttributionResult {
    byAgent: AgentSales[]
    unattributedValue: number
    unattributedTransactions: number
}

export const SalesAttributionService = {
    /**
     * Atribuye ventas SOLO a agentes de Call Center.
     * Todo lo demás se considera NO ATRIBUIBLE.
     */
    attribute(transactions: Transaction[]): SalesAttributionResult {
        const byAgentMap = new Map<string, AgentSales>()

        let unattributedValue = 0
        let unattributedTransactions = 0

        for (const t of transactions) {
            // 🔒 REGLA DE ORO: Solo Call Center cuenta para el agente
            if (t.plataformaCode !== 'CC') {
                unattributedValue += t.valor
                unattributedTransactions++
                continue
            }

            const agent = t.agentName?.trim()
            if (!agent) {
                unattributedValue += t.valor
                unattributedTransactions++
                continue
            }

            const current = byAgentMap.get(agent) ?? {
                agentName: agent,
                transactions: 0,
                totalValue: 0,
            }

            current.transactions += 1
            current.totalValue += t.valor

            byAgentMap.set(agent, current)
        }

        return {
            byAgent: Array.from(byAgentMap.values())
                .sort((a, b) => b.totalValue - a.totalValue),
            unattributedValue,
            unattributedTransactions,
        }
    },
}
