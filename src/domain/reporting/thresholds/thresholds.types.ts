export interface CorrelationThresholds {
    callsPerAgent: {
        overload: number;
        underutilization: number;
    };

    abandonmentRate?: {
        warning: number;
        critical: number;
    };

    transactionsPerAgent?: {
        low: number;
    };
}

export type ShiftThresholds = {
    DAY: CorrelationThresholds;
    NIGHT: CorrelationThresholds;
};
