import { normalizeHour } from './normalizeHour';

describe('normalizeHour', () => {
    it('handles excel number (serial time)', () => {
        expect(normalizeHour(0.5)).toBe('12:00');
        expect(normalizeHour(0.60625)).toBe('14:33');
        expect(normalizeHour(0.375)).toBe('09:00');
    });

    it('handles HH:mm:ss string', () => {
        expect(normalizeHour('14:32:00')).toBe('14:32');
        expect(normalizeHour('09:15:30.500')).toBe('09:15');
    });

    it('handles HH:mm string', () => {
        expect(normalizeHour('14:32')).toBe('14:32');
        expect(normalizeHour('  09:05  ')).toBe('09:05');
    });

    it('handles JS Date object', () => {
        const dt = new Date();
        dt.setHours(15);
        dt.setMinutes(45);
        expect(normalizeHour(dt)).toBe('15:45');
    });

    it('handles edge cases / fallbacks', () => {
        expect(normalizeHour(null)).toBe('00:00');
        expect(normalizeHour(undefined)).toBe('00:00');
        expect(normalizeHour('')).toBe('00:00');
        expect(normalizeHour('garbage')).toBe('00:00');
        expect(normalizeHour('14')).toBe('14:00');
    });
});
