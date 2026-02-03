/**
 * Agent Matching Utilities
 * 
 * Simple, non-smart suggestion algorithm.
 * NO fuzzy matching, NO ML, NO confidence scores.
 * Just basic string comparison.
 */

/**
 * Normalize string for comparison
 * - Lowercase
 * - Remove accents
 * - Remove spaces
 * 
 * CRITICAL: This is ONLY for comparison, never for storage
 */
function normalize(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '');             // Remove spaces
}

export interface Agent {
    id: string;
    name: string;
}

export interface SuggestionResult {
    agentId: string | null;
    reason: string | null;
}

/**
 * Suggest a match for an external name
 * 
 * Algorithm (simple, not smart):
 * 1. Exact match (normalized)
 * 2. Starts with
 * 3. Contains
 * 
 * Returns null if no suggestion
 */
export function suggestMatch(
    externalName: string,
    agents: Agent[]
): SuggestionResult {
    const normalized = normalize(externalName);

    for (const agent of agents) {
        const agentNormalized = normalize(agent.name);

        // Exact match
        if (normalized === agentNormalized) {
            return {
                agentId: agent.id,
                reason: 'Coincidencia exacta'
            };
        }

        // Starts with
        if (agentNormalized.startsWith(normalized)) {
            return {
                agentId: agent.id,
                reason: 'Nombre comienza con'
            };
        }

        // Contains
        if (agentNormalized.includes(normalized)) {
            return {
                agentId: agent.id,
                reason: 'Nombre contiene'
            };
        }
    }

    return {
        agentId: null,
        reason: null
    };
}

/**
 * Extract unique external names from transactions
 */
export function extractExternalNames(
    transactions: Array<{ agentName?: string }>
): string[] {
    const names = new Set<string>();

    transactions.forEach((tx) => {
        if (tx.agentName && tx.agentName.trim()) {
            names.add(tx.agentName.trim()); // Preserve original, just trim
        }
    });

    return Array.from(names).sort();
}
