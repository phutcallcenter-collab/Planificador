
import {
    AnsweredCall,
    AbandonedCall,
    Transaction
} from '../dashboard.types';
import { getShift } from '../shift.service';
import { ActualOperationalLoad } from '../adapter/OperationalCorrelationAdapter';

/**
 * Builds the ActualOperationalLoad[] from raw lists.
 * Aggregates calls and transactions by Date and Shift.
 */
export const ActualOperationalLoadBuilder = {
    build(
        answered: AnsweredCall[],
        abandoned: AbandonedCall[],
        transactions: Transaction[]
    ): ActualOperationalLoad[] {
        const buckets = new Map<string, ActualOperationalLoad>();

        const getKey = (date: string, shift: string) => `${date}|${shift}`;

        // Helper to map 'Día'/'Noche' to 'DAY'/'NIGHT'
        const toShiftKey = (s: string): 'DAY' | 'NIGHT' => s === 'Día' ? 'DAY' : 'NIGHT';

        // Helper to get or create bucket
        const getBucket = (date: string, shiftRaw: string) => {
            const shift = toShiftKey(shiftRaw);
            const key = getKey(date, shift);
            if (!buckets.has(key)) {
                buckets.set(key, {
                    date,
                    shift, // Already 'DAY' | 'NIGHT' from toShiftKey
                    receivedCalls: 0,
                    answeredCalls: 0,
                    abandonedCalls: 0,
                    transactions: 0
                });
            }
            return buckets.get(key)!;
        };

        // 1. Process Answered
        answered.forEach(c => {
            const b = getBucket(c.fecha, c.turno);
            b.answeredCalls += c.llamadas;
            b.receivedCalls += c.llamadas;
        });

        abandoned.forEach(c => {
            const b = getBucket(c.fecha, c.turno);
            b.abandonedCalls += 1;
            b.receivedCalls += 1;
        });

        transactions.forEach(t => {
            if (t.plataforma === 'Call Center') {
                const shift = getShift(t.hora, t.fecha);
                const b = getBucket(t.fecha, shift);
                b.transactions += 1;
            }
        });

        return Array.from(buckets.values()).sort((a, b) =>
            a.date.localeCompare(b.date) || a.shift.localeCompare(b.shift)
        );
    }
};
