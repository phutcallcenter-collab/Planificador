export interface Baseline {
    metric: string;
    window: number; // días
    average: number;
}

export interface SimpleBaseline {
    avg: number;
    std?: number;
}
