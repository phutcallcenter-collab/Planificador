import { parseISO, getDay } from 'date-fns';
import { Shift } from '../dashboard.types';

/**
 * Normalizes HH:mm to 30-minute slots (HH:00 or HH:30)
 */
export function toTimeSlot(hhmm: string): string {
    if (!hhmm || !hhmm.includes(':')) return '00:00';
    const [hh, mm] = hhmm.split(':').map(Number);
    const slotMin = mm < 30 ? '00' : '30';
    return `${String(hh).padStart(2, '0')}:${slotMin}`;
}

/**
 * Resolves the operational shift based on date and time slot.
 * Turno Día: 09:00 - 15:30 (≤ 15:59)
 * Turno Noche (Sun-Thu): 16:00 - 22:30
 * Turno Noche (Fri-Sat): 16:00 - 23:30
 */
export function resolveShift(
    dateISO: string, // yyyy-MM-dd
    hora: string     // HH:mm
): Shift | 'fuera' {
    const slot = toTimeSlot(hora);

    let dateObj;
    try {
        dateObj = parseISO(dateISO);
    } catch (e) {
        return 'fuera';
    }

    const dayOfWeek = getDay(dateObj);
    // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday

    // Turno Día: 09:00 – 15:30 (Includes anything starting at 15:30 and ending before 16:00)
    if (slot >= '09:00' && slot <= '15:30') {
        return 'Día';
    }

    // Turno Noche
    const isWeekendNight = dayOfWeek === 5 || dayOfWeek === 6;

    if (slot >= '16:00') {
        if (isWeekendNight) {
            if (slot <= '23:30') return 'Noche';
        } else {
            if (slot <= '22:30') return 'Noche';
        }
    }

    return 'fuera'; // OUT
}
