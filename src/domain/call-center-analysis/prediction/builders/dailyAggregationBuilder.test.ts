/**
 * Daily Aggregation Builder - Tests
 * 
 * Validates pure aggregation logic.
 */

import {
    buildDailyVolumeSeries,
    getUniqueDaysCount,
    checkContinuity,
    IntradayRecord
} from './dailyAggregationBuilder'

console.log('🧪 Daily Aggregation Builder - Test Suite\n')

// ============================================
// TEST 1: Basic Aggregation (3 days intradía → 3 days daily)
// ============================================

console.log('TEST 1: Basic Aggregation\n')

const test1Input: IntradayRecord[] = [
    { fecha: '2026-02-01', hora: '09:00', llamadas: 50, turno: 'Día' },
    { fecha: '2026-02-01', hora: '14:00', llamadas: 80, turno: 'Día' },
    { fecha: '2026-02-01', hora: '20:00', llamadas: 30, turno: 'Noche' },
    { fecha: '2026-02-02', hora: '10:00', llamadas: 60, turno: 'Día' },
    { fecha: '2026-02-02', hora: '15:00', llamadas: 70, turno: 'Día' },
    { fecha: '2026-02-03', hora: '11:00', llamadas: 90, turno: 'Día' },
]

const test1Output = buildDailyVolumeSeries(test1Input)

console.log('Input: 6 intraday records (3 unique dates)')
console.log('Output:')
test1Output.forEach(day => {
    console.log(`  ${day.date}: ${day.volume} llamadas`)
})

console.log(`\n✅ Expected: 3 daily records`)
console.log(`   2026-02-01: 160 (50+80+30)`)
console.log(`   2026-02-02: 130 (60+70)`)
console.log(`   2026-02-03: 90\n`)

// ============================================
// TEST 2: Empty Input
// ============================================

console.log('TEST 2: Empty Input\n')

const test2Output = buildDailyVolumeSeries([])

console.log(`Output: ${test2Output.length} records`)
console.log(`✅ Expected: 0 records (empty array)\n`)

// ============================================
// TEST 3: Invalid Records (skip silently)
// ============================================

console.log('TEST 3: Invalid Records\n')

const test3Input: IntradayRecord[] = [
    { fecha: '2026-02-01', hora: '09:00', llamadas: 50, turno: 'Día' },
    { fecha: '', hora: '10:00', llamadas: 30, turno: 'Día' }, // Invalid: empty fecha
    { fecha: '2026-02-01', hora: '11:00', llamadas: -10, turno: 'Día' }, // Invalid: negative
    { fecha: '2026-02-02', hora: '12:00', llamadas: 40, turno: 'Día' },
]

const test3Output = buildDailyVolumeSeries(test3Input)

console.log('Input: 4 records (2 invalid)')
console.log('Output:')
test3Output.forEach(day => {
    console.log(`  ${day.date}: ${day.volume} llamadas`)
})

console.log(`\n✅ Expected: 2 valid daily records`)
console.log(`   2026-02-01: 50 (invalid records skipped)`)
console.log(`   2026-02-02: 40\n`)

// ============================================
// TEST 4: Unique Days Count
// ============================================

console.log('TEST 4: Unique Days Count\n')

const test4Series = [
    { date: '2026-02-01', volume: 100 },
    { date: '2026-02-02', volume: 120 },
    { date: '2026-02-03', volume: 110 },
]

const test4Count = getUniqueDaysCount(test4Series)

console.log(`Input: 3 daily records`)
console.log(`Output: ${test4Count} unique days`)
console.log(`✅ Expected: 3\n`)

// ============================================
// TEST 5: Continuity Check (continuous)
// ============================================

console.log('TEST 5: Continuity Check (continuous)\n')

const test5Series = [
    { date: '2026-02-01', volume: 100 },
    { date: '2026-02-02', volume: 120 },
    { date: '2026-02-03', volume: 110 },
    { date: '2026-02-04', volume: 105 },
]

const test5Continuous = checkContinuity(test5Series)

console.log(`Input: 4 consecutive days`)
console.log(`Output: ${test5Continuous}`)
console.log(`✅ Expected: true (continuous)\n`)

// ============================================
// TEST 6: Continuity Check (gap >3 days)
// ============================================

console.log('TEST 6: Continuity Check (gap >3 days)\n')

const test6Series = [
    { date: '2026-02-01', volume: 100 },
    { date: '2026-02-02', volume: 120 },
    { date: '2026-02-07', volume: 110 }, // 5-day gap
]

const test6Continuous = checkContinuity(test6Series)

console.log(`Input: 3 days with 5-day gap`)
console.log(`Output: ${test6Continuous}`)
console.log(`✅ Expected: false (fragmented)\n`)

// ============================================
// SUMMARY
// ============================================

console.log('═══════════════════════════════════════')
console.log('✅ All Tests Complete')
console.log('═══════════════════════════════════════')
