/**
 * Daily Aggregation Builder
 * 
 * Converts intraday operational records to daily volume series.
 * 
 * Philosophy: Pure aggregation, no intelligence.
 * This is accounting, not reasoning.
 */

export interface IntradayRecord {
    fecha: string    // "2026-02-01"
    hora: string     // "14:00"
    llamadas: number
    turno: 'Día' | 'Noche' | 'fuera'
}

export interface DailyVolume {
    date: string     // "2026-02-01"
    volume: number   // total for the day
}

/**
 * Aggregates intraday records into daily volumes.
 * 
 * Rules:
 * - Groups by fecha only
 * - Sums llamadas
 * - Ignores hora and turno completely
 * - Does NOT fill missing days
 * - Does NOT sort
 * - Does NOT correct outliers
 * - Does NOT decide continuity (that's v4)
 * 
 * @param intradayData - Raw operational records (by hour/slot)
 * @returns Daily volume series (one entry per unique date)
 */
export function buildDailyVolumeSeries(
    intradayData: IntradayRecord[]
): DailyVolume[] {

    // Validation: empty input → empty output
    if (!intradayData || intradayData.length === 0) {
        return []
    }

    // Group by fecha
    const dailyMap = new Map<string, number>()

    for (const record of intradayData) {
        // Structural validation
        if (!record.fecha || typeof record.llamadas !== 'number') {
            continue // Skip invalid records silently
        }

        if (record.llamadas < 0) {
            continue // Skip negative volumes silently
        }

        const date = record.fecha
        const currentVolume = dailyMap.get(date) || 0
        dailyMap.set(date, currentVolume + record.llamadas)
    }

    // Convert map to array
    const result: DailyVolume[] = []
    for (const [date, volume] of dailyMap.entries()) {
        result.push({ date, volume })
    }

    return result
}

/**
 * Helper: Get unique days count from daily series
 * (Used for v4 policy checks)
 */
export function getUniqueDaysCount(dailySeries: DailyVolume[]): number {
    return dailySeries.length
}

/**
 * Helper: Check if daily series has continuity
 * (Used for v4 policy checks)
 * 
 * Continuity = no gaps >3 days between consecutive dates
 */
export function checkContinuity(dailySeries: DailyVolume[]): boolean {
    if (dailySeries.length < 2) {
        return true // Single day or empty = continuous by definition
    }

    // Sort by date
    const sorted = [...dailySeries].sort((a, b) => a.date.localeCompare(b.date))

    // Check gaps
    for (let i = 1; i < sorted.length; i++) {
        const prevDate = new Date(sorted[i - 1].date)
        const currDate = new Date(sorted[i].date)

        const diffMs = currDate.getTime() - prevDate.getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)

        if (diffDays > 4) { // >3 days gap (allowing for 4 to account for edge cases)
            return false
        }
    }

    return true
}
