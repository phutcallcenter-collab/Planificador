import { ISODate } from '@/domain/reporting/types';
import {
    ActualOperationalLoad,
    CorrelationFlag,
    ExpectedCoverageSnapshot,
    OperationalCorrelationResult,
} from './correlation.types';
import { ShiftThresholds } from '@/domain/reporting/thresholds/thresholds.types';
import { evaluateLoadFlags, deriveLoadState } from '@/domain/reporting/trends/load-state.service';
import { evaluateTrend } from '@/domain/reporting/trends/trend-evaluator.service';
import { LoadState } from '@/domain/reporting/trends/trend.types';

export const OperationalCorrelationAdapter = {
    correlate(
        expectedList: ExpectedCoverageSnapshot[],
        actualList: ActualOperationalLoad[],
        thresholds: ShiftThresholds,
        baselines?: Record<string, { avg: number }>,
        basis: 'PLANNED' | 'PRESENT' = 'PLANNED'
    ): OperationalCorrelationResult[] {
        const keyOf = (d: ISODate, s: 'DAY' | 'NIGHT') => `${d}|${s}`;

        const expectedMap = new Map<string, ExpectedCoverageSnapshot>();
        expectedList.forEach((e) => {
            expectedMap.set(keyOf(e.date, e.shift), e);
        });

        const results: OperationalCorrelationResult[] = [];
        const stateHistory: Record<string, LoadState[]> = { DAY: [], NIGHT: [] };

        const allKeys = Array.from(new Set([...expectedMap.keys(), ...actualList.map(a => keyOf(a.date, a.shift))])).sort();

        allKeys.forEach((key) => {
            const [date, shift] = key.split('|') as [ISODate, 'DAY' | 'NIGHT'];

            const expected = expectedMap.get(key);
            const actual = actualList.find(a => keyOf(a.date, a.shift) === key); // Optimized locally or pre-mapped above

            const plannedAgents = expected?.plannedAgents ?? 0;
            const presentAgents = expected?.presentAgents ?? 0;

            // SELECT DENOMINATOR BASED ON BASIS
            const activeAgents = basis === 'PLANNED' ? plannedAgents : presentAgents;

            const receivedCalls = actual?.receivedCalls ?? 0;
            const answeredCalls = actual?.answeredCalls ?? 0;
            const abandonedCalls = actual?.abandonedCalls ?? 0;
            const transactions = actual?.transactions ?? 0;

            const callsPerAgent = activeAgents > 0 ? receivedCalls / activeAgents : undefined;
            const transactionsPerAgent = activeAgents > 0 ? transactions / activeAgents : undefined;
            const abandonmentRate = receivedCalls > 0 ? abandonedCalls / receivedCalls : undefined;

            // Use context-aware flags
            const baseline = baselines?.[shift] || { avg: shift === 'DAY' ? 25 : 20 };
            const flags = evaluateLoadFlags(callsPerAgent, activeAgents, baseline);

            const currentState = deriveLoadState(flags);
            stateHistory[shift].push(currentState);

            // Window of 3 for trend analysis
            const window = stateHistory[shift].slice(-3);
            const signal = evaluateTrend(window);

            results.push({
                date,
                shift,
                expectation: {
                    plannedAgents: activeAgents, // Use the active (basis) count for display consistency
                    // We might want to expose both in the future, but for now 'plannedAgents' in the result 
                    // is interpreted as 'the agents we expected to have for this calculation'
                },
                reality: {
                    receivedCalls,
                    answeredCalls,
                    abandonedCalls,
                    transactions,
                },
                deltas: {
                    callsPerAgent,
                    transactionsPerAgent,
                    abandonmentRate,
                },
                trend: {
                    window,
                    signal
                },
                flags,
            });
        });

        return results;
    },
};
