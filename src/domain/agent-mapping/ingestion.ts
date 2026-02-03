/**
 * Agent Mapping Ingestion Service
 * 
 * Detects external names from transactions and creates mappings.
 * NO auto-assignment - only detection and suggestion.
 */

import { useAgentMappingStore } from '@/store/useAgentMappingStore';
import { extractExternalNames, suggestMatch, type Agent } from '@/domain/agent-mapping/matching';
import type { Transaction } from '@/domain/call-center-analysis/dashboard.types';

export interface IngestionResult {
    detected: number;
    newMappings: number;
    existingMappings: number;
}

/**
 * Ingest transactions and create mappings for new external names
 * 
 * CRITICAL: This NEVER auto-assigns. It only:
 * 1. Detects unique external names
 * 2. Checks if mapping already exists
 * 3. Creates SUGERIDO mapping if new
 * 4. Optionally suggests an agent (visual only)
 */
export function ingestTransactions(
    transactions: Transaction[],
    systemAgents: Agent[]
): IngestionResult {
    const store = useAgentMappingStore.getState();

    // Extract unique external names
    const externalNames = extractExternalNames(
        transactions.map(tx => ({ agentName: tx.agentName }))
    );

    let newMappings = 0;
    let existingMappings = 0;

    externalNames.forEach((externalName) => {
        // Check if mapping already exists
        const existing = store.getMappingByExternalName(externalName);

        if (existing) {
            existingMappings++;
            return; // Skip if already mapped
        }

        // Suggest a match (optional, visual only)
        const suggestion = suggestMatch(externalName, systemAgents);

        // Create SUGERIDO mapping
        store.createMapping({
            externalName,
            status: 'SUGERIDO',
            suggestedAgentId: suggestion.agentId || undefined,
            suggestionReason: suggestion.reason || undefined
        });

        newMappings++;
    });

    return {
        detected: externalNames.length,
        newMappings,
        existingMappings
    };
}

/**
 * Get transactions for a confirmed agent
 * 
 * CRITICAL: Only returns transactions if mapping is CONFIRMADO
 */
export function getAgentTransactions(
    agentId: string,
    transactions: Transaction[]
): Transaction[] {
    const store = useAgentMappingStore.getState();

    // Get all CONFIRMADO mappings for this agent
    const confirmedMappings = store.mappings.filter(
        (m) => m.status === 'CONFIRMADO' && m.agentId === agentId
    );

    // Get external names for this agent
    const externalNames = new Set(
        confirmedMappings.map((m) => m.externalName)
    );

    // Filter transactions
    return transactions.filter(
        (tx) => tx.agentName && externalNames.has(tx.agentName)
    );
}

/**
 * Get unmatched transactions
 * Transactions with external names that are not CONFIRMADO
 */
export function getUnmatchedTransactions(
    transactions: Transaction[]
): Transaction[] {
    const store = useAgentMappingStore.getState();

    // Get all CONFIRMADO external names
    const confirmedNames = new Set(
        store.mappings
            .filter((m) => m.status === 'CONFIRMADO')
            .map((m) => m.externalName)
    );

    // Filter transactions without confirmed mapping
    return transactions.filter(
        (tx) => tx.agentName && !confirmedNames.has(tx.agentName)
    );
}
