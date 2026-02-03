import { ISODate } from "../../reporting/types";

// Input A - Expectation (From Planning)
export interface ExpectedCoverageSnapshot {
    date: ISODate;
    shift: 'DAY' | 'NIGHT';
    plannedAgents: number;
    plannedAgentIds: string[];
    expectedCapacity?: number;
}

// Input B - Reality (From Call Center)
export interface ActualOperationalLoad {
    date: ISODate;
    shift: 'DAY' | 'NIGHT';
    receivedCalls: number;
    answeredCalls: number;
    abandonedCalls: number;
    transactions: number;
}

// Output - Correlation Result
export type CorrelationFlag =
    | 'NO_PLANNED_AGENTS'
    | 'CALLS_WITHOUT_CAPACITY'
    | 'OVERLOAD_SUSPECTED'           // CPA > Threshold (Day 40, Night 30)
    | 'UNDERUTILIZATION_SUSPECTED';  // CPA < Min (10)

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
        callsPerAgent?: number;       // The Queen Metric
        transactionsPerAgent?: number;
        abandonmentRate?: number;     // Systemic failure indicator
    };

    flags: CorrelationFlag[];
}

export const OperationalCorrelationAdapter = {
    correlate(
        expectedList: ExpectedCoverageSnapshot[],
        actualList: ActualOperationalLoad[]
    ): OperationalCorrelationResult[] {
        // 1. Collect all unique Date+Shift keys
        const keys = new Set<string>();
        const getKey = (item: { date: ISODate; shift: 'DAY' | 'NIGHT' }) => `${item.date}|${item.shift}`;

        expectedList.forEach(e => keys.add(getKey(e)));
        actualList.forEach(a => keys.add(getKey(a)));

        // 2. Iterate and compare
        return Array.from(keys).map(key => {
            const [date, shiftStr] = key.split('|');
            const shift = shiftStr as 'DAY' | 'NIGHT';

            const expected = expectedList.find(e => e.date === date && e.shift === shift);
            const actual = actualList.find(a => a.date === date && a.shift === shift);

            const plannedAgents = expected?.plannedAgents ?? 0;
            const receivedCalls = actual?.receivedCalls ?? 0;
            const answeredCalls = actual?.answeredCalls ?? 0;
            const abandonedCalls = actual?.abandonedCalls ?? 0;
            const transactions = actual?.transactions ?? 0;

            // 3. Compute Deltas (Canonical)
            const hasAgents = plannedAgents > 0;
            const hasCalls = receivedCalls > 0;

            const callsPerAgent = hasAgents ? receivedCalls / plannedAgents : undefined;
            const transactionsPerAgent = hasAgents ? transactions / plannedAgents : undefined;
            const abandonmentRate = hasCalls ? abandonedCalls / receivedCalls : 0;

            // 4. Generate Flags (Diagnostic)
            const flags: CorrelationFlag[] = [];

            // 4.1 Critical Capacity Faults
            if (plannedAgents === 0 && receivedCalls > 0) {
                flags.push('CALLS_WITHOUT_CAPACITY');
            } else if (plannedAgents === 0) {
                flags.push('NO_PLANNED_AGENTS');
            }

            // 4.3 Overload Suspected (Contextual Thresholds)
            // Day: > 40, Night: > 30 (As per initial reasonable baseline)
            const OVERLOAD_THRESHOLD = shift === 'DAY' ? 40 : 30;
            const UNDERUTILIZATION_THRESHOLD = 10;

            if (callsPerAgent && callsPerAgent > OVERLOAD_THRESHOLD) {
                flags.push('OVERLOAD_SUSPECTED');
            }

            // 4.4 Underutilization Suspected
            if (callsPerAgent && callsPerAgent < UNDERUTILIZATION_THRESHOLD) {
                flags.push('UNDERUTILIZATION_SUSPECTED');
            }

            return {
                date,
                shift,
                expectation: { plannedAgents },
                reality: { receivedCalls, answeredCalls, abandonedCalls, transactions },
                deltas: {
                    callsPerAgent,
                    transactionsPerAgent,
                    abandonmentRate
                },
                flags
            };
        }).sort((a, b) => a.date.localeCompare(b.date) || a.shift.localeCompare(b.shift));
    }
};
