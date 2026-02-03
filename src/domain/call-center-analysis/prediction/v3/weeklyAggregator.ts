// prediction/v3/weeklyAggregator.ts

import { WeeklyPrediction, WeeklyPredictionInput, DaySeverity } from './types'

/**
 * Weekly Trend-Aware Aggregator
 * 
 * Generates 7-day prediction for operational planning.
 * Reuses v2 baseline and trend detection.
 * 
 * Philosophy: Help humans decide where to focus, not predict precisely.
 */

/**
 * Generates weekly prediction from v2 outputs
 */
export function generateWeeklyPrediction(
    input: WeeklyPredictionInput
): WeeklyPrediction {

    const { startDate, v2Baseline, v2Trend, v2Variability } = input

    // Calculate 7-day horizon
    const horizon = calculateHorizon(startDate)

    // Generate daily outlook
    const dailyOutlook = generateDailyOutlook(
        horizon.dates,
        v2Baseline.avgVolume,
        v2Trend,
        v2Baseline.confidence
    )

    // Identify peak day
    const peakDay = identifyPeakDay(dailyOutlook)

    // Build summary
    const summary = {
        peakDay: peakDay.date,
        peakChange: peakDay.relativeChange,
        trendDirection: v2Trend.direction,
        variability: v2Variability.level,
        confidence: v2Baseline.confidence,
        assumptions: buildAssumptions(v2Baseline, v2Trend),
        warnings: buildWarnings(v2Baseline, v2Trend)
    }

    return {
        horizon: {
            start: horizon.start,
            end: horizon.end,
            days: 7
        },
        baseline: {
            avgDailyVolume: v2Baseline.avgVolume,
            source: 'v2_model',
            confidence: v2Baseline.confidence,
            historicalDays: v2Baseline.historicalDays
        },
        dailyOutlook,
        summary,
        meta: {
            generatedAt: new Date().toISOString(),
            modelVersion: 'v3',
            baseModelVersion: 'v2',
            trendDetected: v2Trend.detected,
            trendMagnitude: v2Trend.detected ? v2Trend.magnitude : undefined
        }
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate 7-day horizon from start date
 */
function calculateHorizon(startDate: string) {
    const start = new Date(startDate)
    const dates: string[] = []

    for (let i = 0; i < 7; i++) {
        const date = new Date(start)
        date.setDate(start.getDate() + i)
        dates.push(date.toISOString().split('T')[0])
    }

    return {
        start: dates[0],
        end: dates[6],
        dates
    }
}

/**
 * Generate daily outlook with trend adjustment
 */
function generateDailyOutlook(
    dates: string[],
    baseline: number,
    trend: { detected: boolean; magnitude: number },
    confidence: string
) {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

    return dates.map((date, i) => {
        // Calculate relative change
        let relativeChange = 0

        if (trend.detected) {
            // Distribute trend magnitude across 7 days
            const slope = trend.magnitude / 7
            relativeChange = slope * i
        }

        // Calculate predicted volume (only if confidence >= MEDIA)
        const predictedVolume = confidence !== 'BAJA' && confidence !== 'INVALIDA'
            ? Math.round(baseline * (1 + relativeChange))
            : undefined

        // Classify severity (based SOLELY on relativeChange)
        const severity = classifySeverity(relativeChange)

        // Get day of week
        const dateObj = new Date(date)
        const dayOfWeek = dayNames[dateObj.getDay()]

        return {
            date,
            dayOfWeek,
            relativeChange,
            severity,
            predictedVolume,
            note: undefined // Can be added later for exceptional days
        }
    })
}

/**
 * Classify severity based on relative change
 * 
 * CRITICAL: Based SOLELY on relativeChange, not absolute volume
 */
function classifySeverity(relativeChange: number): DaySeverity {
    const absChange = Math.abs(relativeChange)

    if (absChange > 0.10) return 'CRITICAL'  // >10%
    if (absChange > 0.05) return 'ELEVATED'  // 5-10%
    return 'NORMAL'                          // ±5%
}

/**
 * Identify peak day (highest absolute relative change)
 */
function identifyPeakDay(dailyOutlook: any[]) {
    let peak = dailyOutlook[0]

    for (const day of dailyOutlook) {
        if (Math.abs(day.relativeChange) > Math.abs(peak.relativeChange)) {
            peak = day
        }
    }

    return peak
}

/**
 * Build assumptions list
 */
function buildAssumptions(
    baseline: { avgVolume: number; historicalDays: number },
    trend: { detected: boolean; magnitude: number; direction: string }
): string[] {
    const assumptions: string[] = []

    if (trend.detected) {
        assumptions.push(
            `Tendencia ${trend.direction} detectada (${(trend.magnitude * 100).toFixed(1)}%)`
        )
    }

    assumptions.push(
        `Baseline derivado de últimos ${baseline.historicalDays} días`
    )

    assumptions.push(
        'Asume continuidad operativa (sin eventos externos)'
    )

    return assumptions
}

/**
 * Build warnings list
 */
function buildWarnings(
    baseline: { confidence: string },
    trend: { detected: boolean }
): string[] {
    const warnings: string[] = []

    if (baseline.confidence === 'BAJA') {
        warnings.push('Confianza baja: usar solo como referencia orientativa')
    }

    if (trend.detected) {
        warnings.push('Extrapolación lineal: tendencia puede no continuar')
    }

    warnings.push('No considera eventos externos (feriados, campañas)')

    return warnings
}
