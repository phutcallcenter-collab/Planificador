import { OperationalMetricSeries } from '../trends/series.types';
import { Baseline } from './baseline.types';

export function computeBaseline(
    series: OperationalMetricSeries,
    window = 7
): Baseline | null {
    const recent = series.points.slice(-window);
    if (recent.length === 0) return null;

    const values = recent
        .map(p => {
            const val = p[series.metric];
            return typeof val === 'number' ? val : null;
        })
        .filter((v): v is number => v !== null);

    if (values.length === 0) return null;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return {
        metric: series.metric,
        window,
        average: avg
    };
}
