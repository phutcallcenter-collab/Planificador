import { ISODate } from '@/domain/reporting/types';

export interface OperationalMetricPoint {
    date: ISODate;
    shift: 'DAY' | 'NIGHT';

    callsPerAgent?: number;
    abandonmentRate?: number;
    transactionsPerAgent?: number;
}

export interface OperationalMetricSeries {
    metric: 'callsPerAgent' | 'abandonmentRate' | 'transactionsPerAgent';
    points: OperationalMetricPoint[];
}
