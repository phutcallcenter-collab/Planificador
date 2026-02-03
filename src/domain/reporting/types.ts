export type ISODate = string; // e.g., "2024-01-01"

export interface DateRange {
    from: ISODate;
    to: ISODate;
}

export interface AnalysisContext {
    dateRange: DateRange;
    granularity: 'DAY' | 'WEEK' | 'MONTH';
}
