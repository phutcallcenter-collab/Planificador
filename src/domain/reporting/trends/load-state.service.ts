import { CorrelationFlag } from "@/domain/call-center-analysis/correlation/correlation.types";
import { LoadState } from "./trend.types";
import { SimpleBaseline } from "../thresholds/baseline.types";

export function deriveLoadState(flags: CorrelationFlag[]): LoadState {
    if (flags.includes('OVERLOAD_SUSPECTED')) return 'OVERLOAD';
    if (flags.includes('LOAD_INCREASING')) return 'INCREASING';
    if (flags.includes('UNDERUTILIZATION_SUSPECTED')) return 'UNDERUTILIZED';
    if (flags.includes('NO_BASELINE')) return 'UNKNOWN';
    return 'NORMAL';
}

export function evaluateLoadFlags(
    callsPerAgent: number | undefined,
    plannedAgents: number,
    baseline: SimpleBaseline | null
): CorrelationFlag[] {
    const flags: CorrelationFlag[] = [];

    if (plannedAgents === 0) {
        flags.push('NO_PLANNED_AGENTS');
        return flags;
    }

    if (!baseline || callsPerAgent === undefined) {
        flags.push('NO_BASELINE');
        return flags;
    }

    if (callsPerAgent >= baseline.avg * 1.25) {
        flags.push('OVERLOAD_SUSPECTED');
    } else if (callsPerAgent >= baseline.avg * 1.10) {
        flags.push('LOAD_INCREASING');
    } else if (callsPerAgent <= baseline.avg * 0.75) {
        flags.push('UNDERUTILIZATION_SUSPECTED');
    }

    return flags;
}
