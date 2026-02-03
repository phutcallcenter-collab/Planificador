import { TrendDirection, TrendMetric, TrendSemantic } from './trend.types';

export function computeTrend(
    current: number | undefined,
    previous: number | undefined,
    tolerancePct = 0.05
): TrendMetric {
    if (current == null || previous == null) {
        return { current: current ?? null, previous: previous ?? null, delta: null, direction: 'FLAT' };
    }

    const delta = current - previous;
    const pct = Math.abs(delta) / Math.max(previous, 1);

    if (pct < tolerancePct) {
        return { current, previous, delta, direction: 'FLAT' };
    }

    return {
        current,
        previous,
        delta,
        direction: delta > 0 ? 'UP' : 'DOWN',
    };
}

export function deriveTrendSemantic(
    metric: 'callsPerAgent' | 'abandonmentRate' | 'transactionsPerAgent',
    direction: TrendDirection
): TrendSemantic {
    if (direction === 'FLAT') return 'STABLE';

    const worseWhenUp = metric !== 'transactionsPerAgent';

    if (direction === 'UP') {
        return worseWhenUp ? 'WORSENING' : 'IMPROVING';
    }

    return worseWhenUp ? 'IMPROVING' : 'WORSENING';
}
