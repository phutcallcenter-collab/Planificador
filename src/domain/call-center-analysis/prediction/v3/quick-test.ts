// Quick v3 test
import { generateWeeklyPrediction } from './weeklyAggregator'

const result = generateWeeklyPrediction({
    startDate: '2026-02-03',
    historicalData: [],
    v2Baseline: {
        avgVolume: 180,
        confidence: 'MEDIA',
        historicalDays: 14
    },
    v2Trend: {
        detected: true,
        direction: 'UP',
        magnitude: 0.12 // 12%
    }
})

console.log(JSON.stringify(result, null, 2))
