import { ISODate } from '@/domain/reporting/types';

export interface PredictionEnvelope<T> {
    horizon: number;              // días hacia adelante
    confidence: number;           // 0..1
    method: 'HEURISTIC' | 'STAT' | 'ML';
    predicted: T;
}

export interface PredictionResult {
    date: ISODate;
    shift: 'DAY' | 'NIGHT';
    metric: string;
    predictedValue: number;
    confidence?: number;
    model: 'NAIVE' | 'MOVING_AVG' | 'REGRESSION' | 'ML';
}
