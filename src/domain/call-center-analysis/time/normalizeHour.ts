/**
 * Entradas posibles (XLSX, CSV, Manual): unknown
 * Salida: "HH:mm" SIEMPRE
 */
export function normalizeHour(raw: unknown): string {
    if (raw === null || raw === undefined || raw === '') return '00:00';

    // Case 1: Excel numeric time (0.0 → 1.0)
    if (typeof raw === 'number') {
        const totalMinutes = Math.round(raw * 24 * 60);
        const hh = Math.floor(totalMinutes / 60);
        const mm = totalMinutes % 60;
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }

    // Case 2: JS Date
    if (raw instanceof Date) {
        return `${String(raw.getHours()).padStart(2, '0')}:${String(raw.getMinutes()).padStart(2, '0')}`;
    }

    // Case 3: string
    if (typeof raw === 'string') {
        const s = raw.trim();
        // "HH:mm:ss", "HH:mm", "HH:mm:ss.SSS"
        const match = s.match(/^(\d{1,2}):(\d{2})/);
        if (match) {
            return `${match[1].padStart(2, '0')}:${match[2]}`;
        }

        // Si viene solo un número como string, ej "14"
        if (/^\d{1,2}$/.test(s)) {
            return `${s.padStart(2, '0')}:00`;
        }
    }

    // Fallback (fail safe)
    return '00:00';
}
