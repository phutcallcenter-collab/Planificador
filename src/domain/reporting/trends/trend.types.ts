export type TrendDirection =
    | 'UP'        // empeoró
    | 'DOWN'      // mejoró
    | 'FLAT';     // sin cambio relevante

export interface TrendMetric {
    current: number | null;
    previous: number | null;
    delta: number | null;
    direction: TrendDirection;
}

export type TrendSemantic =
    | 'IMPROVING'
    | 'WORSENING'
    | 'STABLE';

export type LoadState =
    | 'NORMAL'
    | 'INCREASING'
    | 'OVERLOAD'
    | 'UNDERUTILIZED'
    | 'UNKNOWN';

export type TrendSignal =
    | 'STABLE'
    | 'DEGRADING'
    | 'IMPROVING'
    | 'VOLATILE';
