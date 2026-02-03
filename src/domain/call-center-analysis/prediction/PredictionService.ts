
import { addDays, format, parseISO } from 'date-fns'
import { ActualOperationalLoad } from '../adapter/OperationalCorrelationAdapter'

export type Trend = 'UP' | 'STABLE' | 'DOWN'

export interface PredictionResult extends ActualOperationalLoad {
    trend: Trend
    minExpected: number
    maxExpected: number
    source: 'PREDICTION_HONEST_V1'
}

interface HistoricalPoint {
    date: string
    shift: 'DAY' | 'NIGHT'
    receivedCalls: number
}

/**
 * Prediction Service Honest V1
 * Focused on Trends and Ranges rather than absolute theoretical volumes.
 * 
 * Logic:
 * 1. Computes a real baseline (average) from all data.
 * 2. Evaluates Trend based on the last 3 data points.
 * 3. Projects a Range (min/max) based on that trend.
 */
export const PredictionService = {
    generate(
        startDate: string,
        days: number = 7,
        history: HistoricalPoint[]
    ): PredictionResult[] {
        const result: PredictionResult[] = []
        let cursor = parseISO(startDate)

        // 1. Group history by shift to compute independent baselines
        const shiftHistory = {
            DAY: history.filter(h => h.shift === 'DAY').map(h => h.receivedCalls),
            NIGHT: history.filter(h => h.shift === 'NIGHT').map(h => h.receivedCalls)
        }

        const computeBaseline = (vals: number[]) =>
            vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0

        const evaluateTrend = (vals: number[]): Trend => {
            if (vals.length < 3) return 'STABLE'
            const [a, b, c] = vals.slice(-3)
            if (c > b && b > a) return 'UP'
            if (c < b && b < a) return 'DOWN'
            return 'STABLE'
        }

        const getRange = (baseline: number, trend: Trend) => {
            switch (trend) {
                case 'UP': return { min: baseline * 1.05, max: baseline * 1.25 }
                case 'DOWN': return { min: baseline * 0.75, max: baseline * 0.95 }
                default: return { min: baseline * 0.90, max: baseline * 1.10 }
            }
        }

        const baselines = {
            DAY: computeBaseline(shiftHistory.DAY),
            NIGHT: computeBaseline(shiftHistory.NIGHT)
        }

        const trends = {
            DAY: evaluateTrend(shiftHistory.DAY),
            NIGHT: evaluateTrend(shiftHistory.NIGHT)
        }

        for (let i = 0; i < days; i++) {
            const dateStr = format(cursor, 'yyyy-MM-dd')

                ; (['DAY', 'NIGHT'] as const).forEach(shift => {
                    const base = baselines[shift]
                    const trend = trends[shift]
                    const range = getRange(base, trend)

                    result.push({
                        date: dateStr,
                        shift,
                        receivedCalls: Math.round((range.min + range.max) / 2), // Reference point
                        answeredCalls: 0,
                        abandonedCalls: 0,
                        transactions: 0,
                        trend,
                        minExpected: Math.round(range.min),
                        maxExpected: Math.round(range.max),
                        source: 'PREDICTION_HONEST_V1'
                    })
                })

            cursor = addDays(cursor, 1)
        }

        return result
    }
}
