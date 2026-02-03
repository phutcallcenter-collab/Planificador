import { DateRange } from '@/domain/reporting/types';

export interface DateRangeValidationResult {
    valid: boolean;
    range?: DateRange;
    errors: string[];
}

export const DateRangeValidationService = {
    validate(ranges: {
        answered?: string[];
        abandoned?: string[];
        transactions?: string[];
    }): DateRangeValidationResult {
        const errors: string[] = [];
        const activeRanges: { role: string; range: DateRange }[] = [];

        const extractRange = (dates: string[] | undefined): DateRange | null => {
            if (!dates || dates.length === 0) return null;
            const sorted = Array.from(new Set(dates)).sort();
            return { from: sorted[0], to: sorted[sorted.length - 1] };
        };

        const rAnswered = extractRange(ranges.answered);
        const rAbandoned = extractRange(ranges.abandoned);
        const rTransactions = extractRange(ranges.transactions);

        if (rAnswered) activeRanges.push({ role: 'Contestadas', range: rAnswered });
        if (rAbandoned) activeRanges.push({ role: 'Abandonadas', range: rAbandoned });
        if (rTransactions) activeRanges.push({ role: 'Transacciones', range: rTransactions });

        // If no files loaded yet, it's technically valid (empty state)
        if (activeRanges.length === 0) {
            return { valid: true, range: undefined, errors: [] };
        }

        // Compare all active ranges against the first one
        const reference = activeRanges[0].range;
        const mismatches = activeRanges.filter(r =>
            r.range.from !== reference.from || r.range.to !== reference.to
        );

        if (mismatches.length > 0) {
            errors.push('Los rangos de fechas no coinciden entre los archivos cargados:');
            activeRanges.forEach(r => {
                errors.push(`${r.role}: ${r.range.from} - ${r.range.to}`);
            });

            return { valid: false, errors };
        }

        return {
            valid: true,
            range: reference,
            errors: [],
        };
    },
};
