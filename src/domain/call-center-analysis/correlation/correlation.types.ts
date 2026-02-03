import { ISODate } from '@/domain/reporting/types';
import { PredictionEnvelope } from '@/domain/reporting/prediction/prediction.types';
import { LoadState, TrendSignal } from '@/domain/reporting/trends/trend.types';

export interface ExpectedCoverageSnapshot {
    date: ISODate;
    shift: 'DAY' | 'NIGHT';
    plannedAgents: number;
    presentAgents: number;
    plannedAgentIds: string[];
}

export interface ActualOperationalLoad {
    date: ISODate;
    shift: 'DAY' | 'NIGHT';
    receivedCalls: number;
    answeredCalls: number;
    abandonedCalls: number;
    transactions: number;
}

export type CorrelationFlag =
    | 'NO_PLANNED_AGENTS'
    | 'CALLS_WITHOUT_CAPACITY'
    | 'NO_BASELINE'
    | 'LOAD_INCREASING'
    | 'OVERLOAD_SUSPECTED'
    | 'UNDERUTILIZATION_SUSPECTED';

export interface OperationalCorrelationResult {
    date: ISODate;
    shift: 'DAY' | 'NIGHT';

    expectation: {
        plannedAgents: number;
    };

    reality: {
        receivedCalls: number;
        answeredCalls: number;
        abandonedCalls: number;
        transactions: number;
    };

    deltas: {
        callsPerAgent?: number;
        transactionsPerAgent?: number;
        abandonmentRate?: number;
    };

    trend?: {
        window: LoadState[];
        signal: TrendSignal;
    };

    prediction?: PredictionEnvelope<TrendSignal>;

    flags: CorrelationFlag[];
}
