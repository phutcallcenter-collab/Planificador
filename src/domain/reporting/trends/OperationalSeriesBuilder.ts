import { OperationalCorrelationResult } from '@/domain/call-center-analysis/correlation/correlation.types';
import { OperationalMetricSeries } from './series.types';

export const OperationalSeriesBuilder = {
    fromCorrelation(
        results: OperationalCorrelationResult[]
    ): OperationalMetricSeries[] {
        const metrics = [
            'callsPerAgent',
            'abandonmentRate',
            'transactionsPerAgent'
        ] as const;

        return metrics.map(metric => ({
            metric,
            points: results
                .filter(r => r.deltas[metric] !== undefined)
                .map(r => ({
                    date: r.date,
                    shift: r.shift,
                    [metric]: r.deltas[metric]
                }))
        }));
    }
};
