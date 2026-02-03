/**
 * Daily Operational Snapshot
 * 
 * Purpose: Avoid re-loading Excel files to see historical trends
 * 
 * Rules:
 * - 1 snapshot per day
 * - Immutable
 * - No overwrite
 * - No backfill
 * - No recalculation
 * 
 * This is accounting, not analysis.
 */

export interface DailyOperationalSnapshot {
    id: string;
    date: string; // YYYY-MM-DD

    // Call Center only
    totalCalls: number;
    answeredCalls: number;
    abandonedCalls: number;
    conversionRate: number;

    // Pressure indicators
    cpaDay: number;
    cpaNight: number;

    // Traceability
    sourceFileHash: string;
    createdAt: Date;
}

export interface SnapshotFilters {
    startDate?: string;
    endDate?: string;
}
