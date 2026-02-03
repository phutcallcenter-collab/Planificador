/**
 * Agent External Mapping
 * 
 * Infrastructure for linking external transaction names to system agents.
 * This is NOT business logic - it's identity infrastructure.
 * 
 * CRITICAL RULES:
 * - Never auto-assign without explicit human confirmation
 * - externalName is sacred (never normalize for storage)
 * - Once CONFIRMADO, immutable from normal UI
 * - Audit trail is mandatory (who, when)
 */

export type MappingStatus = 'CONFIRMADO' | 'SUGERIDO' | 'NO_RECONOCIDO';

export interface AgentExternalMapping {
    id: string;                    // UUID
    externalName: string;          // Exactly as it appears in file (sacred)
    agentId: string | null;        // UUID of system agent (null if NO_RECONOCIDO)
    status: MappingStatus;

    // Audit trail (mandatory)
    confirmedBy: string | null;    // Username who confirmed
    confirmedAt: Date | null;      // When confirmed

    // Metadata
    createdAt: Date;
    updatedAt: Date;

    // Optional: suggestion metadata (for SUGERIDO status)
    suggestedAgentId?: string | null;
    suggestionReason?: string | null;
}

/**
 * Mapping creation input
 * Used when creating new mappings from transaction ingestion
 */
export interface CreateMappingInput {
    externalName: string;
    status?: MappingStatus;        // Default: 'SUGERIDO'
    suggestedAgentId?: string;     // Optional suggestion
    suggestionReason?: string;     // Why this suggestion
}

/**
 * Mapping confirmation input
 * Used when human confirms a mapping
 */
export interface ConfirmMappingInput {
    mappingId: string;
    agentId: string | null;        // null if NO_RECONOCIDO
    confirmedBy: string;           // Username (mandatory)
}

/**
 * Mapping query filters
 */
export interface MappingFilters {
    status?: MappingStatus;
    agentId?: string;
    externalName?: string;
}

/**
 * Mapping statistics
 * For dashboard display
 */
export interface MappingStats {
    total: number;
    confirmados: number;
    sugeridos: number;
    noReconocidos: number;
    pendientes: number;            // SUGERIDO count
}
