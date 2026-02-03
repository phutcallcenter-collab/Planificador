import { Shift } from '@/domain/call-center-analysis/dashboard.types';
import { resolveShift } from './time/shiftResolver';

// We keep SHIFTS for type/config reference, but the truth is in the resolver.
export const SHIFTS: Record<Shift, { start: number; end: number }> = {
  Día: { start: 9, end: 16 },
  Noche: { start: 16, end: 24 },
};

/**
 * Canonical shift getter.
 * IMPORTANT: Now requires date for accurate Friday/Saturday Night calculation.
 */
export function getShift(time: string, dateISO: string = '2024-01-01'): Shift | 'fuera' {
  return resolveShift(dateISO, time);
}
