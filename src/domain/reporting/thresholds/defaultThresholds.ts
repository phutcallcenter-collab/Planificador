import { ShiftThresholds } from './thresholds.types';

export const DEFAULT_THRESHOLDS: ShiftThresholds = {
    DAY: {
        callsPerAgent: {
            overload: 40,
            underutilization: 10,
        },
        abandonmentRate: {
            warning: 0.08,   // 8%
            critical: 0.15,  // 15%
        },
    },

    NIGHT: {
        callsPerAgent: {
            overload: 30,
            underutilization: 8,
        },
        abandonmentRate: {
            warning: 0.10,
            critical: 0.18,
        },
    },
};
