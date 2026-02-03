import { LoadState, TrendSignal } from "./trend.types";

export function evaluateTrend(states: LoadState[]): TrendSignal {
    if (states.length < 3) return 'STABLE';

    const last = states.slice(-3);

    if (last.every(s => s === 'OVERLOAD')) return 'DEGRADING';

    if (
        last[0] === 'OVERLOAD' &&
        last[1] === 'INCREASING' &&
        last[2] === 'NORMAL'
    ) return 'IMPROVING';

    // Volatile if there's high entropy in the last 3 states
    if (new Set(last).size > 2) return 'VOLATILE';

    return 'STABLE';
}
