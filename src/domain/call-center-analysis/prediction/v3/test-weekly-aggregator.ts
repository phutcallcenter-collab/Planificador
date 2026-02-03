/**
 * v3 Weekly Prediction - Synthetic Test
 * 
 * Verifies weekly aggregator logic without real data.
 * Tests: stable baseline, upward trend, downward trend.
 */

import { generateWeeklyPrediction } from './weeklyAggregator'
import { WeeklyPredictionInput } from './types'

console.log('═══════════════════════════════════════════════════════')
console.log('  v3 Weekly Aggregator - Synthetic Tests')
console.log('═══════════════════════════════════════════════════════\n')

// ============================================
// TEST 1: Stable Baseline (No Trend)
// ============================================

console.log('🧪 TEST 1: Stable Baseline (No Trend)\n')

const test1Input: WeeklyPredictionInput = {
    startDate: '2026-02-03',
    historicalData: [], // Not used in aggregator
    v2Baseline: {
        avgVolume: 180,
        confidence: 'ALTA',
        historicalDays: 28
    },
    v2Trend: {
        detected: false,
        direction: 'STABLE',
        magnitude: 0
    }
}

const test1Output = generateWeeklyPrediction(test1Input)

console.log(`Horizon: ${test1Output.horizon.start} → ${test1Output.horizon.end}`)
console.log(`Baseline: ${test1Output.baseline.avgDailyVolume} (${test1Output.baseline.confidence})`)
console.log(`Trend: ${test1Output.summary.trendDirection}\n`)

console.log('Daily Outlook:')
test1Output.dailyOutlook.forEach(day => {
    const change = (day.relativeChange * 100).toFixed(1)
    const sign = day.relativeChange >= 0 ? '+' : ''
    console.log(`  ${day.dayOfWeek.padEnd(10)} ${sign}${change}%  ${day.severity.padEnd(10)} ${day.predictedVolume || 'N/A'}`)
})

console.log(`\nPeak Day: ${test1Output.summary.peakDay} (${(test1Output.summary.peakChange * 100).toFixed(1)}%)`)
console.log(`\n✅ Expected: All days NORMAL, relativeChange = 0%\n`)

// ============================================
// TEST 2: Upward Trend
// ============================================

console.log('🧪 TEST 2: Upward Trend (8.5%)\n')

const test2Input: WeeklyPredictionInput = {
    startDate: '2026-02-10',
    historicalData: [],
    v2Baseline: {
        avgVolume: 180,
        confidence: 'MEDIA',
        historicalDays: 14
    },
    v2Trend: {
        detected: true,
        direction: 'UP',
        magnitude: 0.085 // 8.5%
    }
}

const test2Output = generateWeeklyPrediction(test2Input)

console.log(`Horizon: ${test2Output.horizon.start} → ${test2Output.horizon.end}`)
console.log(`Baseline: ${test2Output.baseline.avgDailyVolume} (${test2Output.baseline.confidence})`)
console.log(`Trend: ${test2Output.summary.trendDirection} (${(test2Output.meta.trendMagnitude! * 100).toFixed(1)}%)\n`)

console.log('Daily Outlook:')
test2Output.dailyOutlook.forEach(day => {
    const change = (day.relativeChange * 100).toFixed(1)
    const sign = day.relativeChange >= 0 ? '+' : ''
    console.log(`  ${day.dayOfWeek.padEnd(10)} ${sign}${change}%  ${day.severity.padEnd(10)} ${day.predictedVolume || 'N/A'}`)
})

console.log(`\nPeak Day: ${test2Output.summary.peakDay} (${(test2Output.summary.peakChange * 100).toFixed(1)}%)`)
console.log(`Assumptions: ${test2Output.summary.assumptions.join(', ')}`)
console.log(`\n✅ Expected: Growing relativeChange, last days ELEVATED/CRITICAL\n`)

// ============================================
// TEST 3: Downward Trend
// ============================================

console.log('🧪 TEST 3: Downward Trend (-6%)\n')

const test3Input: WeeklyPredictionInput = {
    startDate: '2026-02-17',
    historicalData: [],
    v2Baseline: {
        avgVolume: 200,
        confidence: 'MEDIA',
        historicalDays: 14
    },
    v2Trend: {
        detected: true,
        direction: 'DOWN',
        magnitude: -0.06 // -6%
    }
}

const test3Output = generateWeeklyPrediction(test3Input)

console.log(`Horizon: ${test3Output.horizon.start} → ${test3Output.horizon.end}`)
console.log(`Baseline: ${test3Output.baseline.avgDailyVolume} (${test3Output.baseline.confidence})`)
console.log(`Trend: ${test3Output.summary.trendDirection} (${(test3Output.meta.trendMagnitude! * 100).toFixed(1)}%)\n`)

console.log('Daily Outlook:')
test3Output.dailyOutlook.forEach(day => {
    const change = (day.relativeChange * 100).toFixed(1)
    const sign = day.relativeChange >= 0 ? '+' : ''
    console.log(`  ${day.dayOfWeek.padEnd(10)} ${sign}${change}%  ${day.severity.padEnd(10)} ${day.predictedVolume || 'N/A'}`)
})

console.log(`\nPeak Day: ${test3Output.summary.peakDay} (${(test3Output.summary.peakChange * 100).toFixed(1)}%)`)
console.log(`\n✅ Expected: Negative relativeChange, first days may be ELEVATED\n`)

// ============================================
// TEST 4: Low Confidence (BAJA)
// ============================================

console.log('🧪 TEST 4: Low Confidence (No predictedVolume)\n')

const test4Input: WeeklyPredictionInput = {
    startDate: '2026-02-24',
    historicalData: [],
    v2Baseline: {
        avgVolume: 150,
        confidence: 'BAJA',
        historicalDays: 10
    },
    v2Trend: {
        detected: false,
        direction: 'STABLE',
        magnitude: 0
    }
}

const test4Output = generateWeeklyPrediction(test4Input)

console.log(`Baseline: ${test4Output.baseline.avgDailyVolume} (${test4Output.baseline.confidence})`)
console.log(`Warnings: ${test4Output.summary.warnings.join(', ')}\n`)

console.log('Daily Outlook:')
test4Output.dailyOutlook.forEach(day => {
    const change = (day.relativeChange * 100).toFixed(1)
    const sign = day.relativeChange >= 0 ? '+' : ''
    console.log(`  ${day.dayOfWeek.padEnd(10)} ${sign}${change}%  ${day.severity.padEnd(10)} ${day.predictedVolume || 'N/A'}`)
})

console.log(`\n✅ Expected: predictedVolume = undefined (confidence BAJA)\n`)

console.log('═══════════════════════════════════════════════════════')
console.log('  ✅ All Tests Complete')
console.log('═══════════════════════════════════════════════════════\n')
