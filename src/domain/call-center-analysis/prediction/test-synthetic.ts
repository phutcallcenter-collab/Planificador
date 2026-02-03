/**
 * Prediction Engine - Synthetic Test
 * 
 * Test hostil con datos inventados.
 * Si esto no corre en 5 minutos, el engine está mal diseñado.
 */

import { PredictionEngine } from './engine/PredictionEngine'
import { PredictionInput, HistoricalSlotData, Slot, PlannedCapacity } from './domain/types'

// ============================================
// DATOS SINTÉTICOS
// ============================================

const historicalData: HistoricalSlotData[] = [
    // Día 1
    { date: '2026-01-20', time: '08:00', shift: 'DAY', receivedCalls: 120, answeredCalls: 115, abandonedCalls: 5, transactions: 45 },
    { date: '2026-01-20', time: '14:00', shift: 'DAY', receivedCalls: 150, answeredCalls: 140, abandonedCalls: 10, transactions: 60 },
    { date: '2026-01-20', time: '20:00', shift: 'NIGHT', receivedCalls: 80, answeredCalls: 75, abandonedCalls: 5, transactions: 30 },

    // Día 2
    { date: '2026-01-21', time: '08:00', shift: 'DAY', receivedCalls: 125, answeredCalls: 120, abandonedCalls: 5, transactions: 48 },
    { date: '2026-01-21', time: '14:00', shift: 'DAY', receivedCalls: 155, answeredCalls: 145, abandonedCalls: 10, transactions: 62 },
    { date: '2026-01-21', time: '20:00', shift: 'NIGHT', receivedCalls: 85, answeredCalls: 80, abandonedCalls: 5, transactions: 32 },

    // Día 3
    { date: '2026-01-22', time: '08:00', shift: 'DAY', receivedCalls: 130, answeredCalls: 125, abandonedCalls: 5, transactions: 50 },
    { date: '2026-01-22', time: '14:00', shift: 'DAY', receivedCalls: 160, answeredCalls: 150, abandonedCalls: 10, transactions: 65 },
    { date: '2026-01-22', time: '20:00', shift: 'NIGHT', receivedCalls: 90, answeredCalls: 85, abandonedCalls: 5, transactions: 35 },

    // Día 4
    { date: '2026-01-23', time: '08:00', shift: 'DAY', receivedCalls: 135, answeredCalls: 130, abandonedCalls: 5, transactions: 52 },
    { date: '2026-01-23', time: '14:00', shift: 'DAY', receivedCalls: 165, answeredCalls: 155, abandonedCalls: 10, transactions: 68 },
    { date: '2026-01-23', time: '20:00', shift: 'NIGHT', receivedCalls: 95, answeredCalls: 90, abandonedCalls: 5, transactions: 38 },

    // Día 5
    { date: '2026-01-24', time: '08:00', shift: 'DAY', receivedCalls: 140, answeredCalls: 135, abandonedCalls: 5, transactions: 55 },
    { date: '2026-01-24', time: '14:00', shift: 'DAY', receivedCalls: 170, answeredCalls: 160, abandonedCalls: 10, transactions: 70 },
    { date: '2026-01-24', time: '20:00', shift: 'NIGHT', receivedCalls: 100, answeredCalls: 95, abandonedCalls: 5, transactions: 40 },

    // Día 6
    { date: '2026-01-25', time: '08:00', shift: 'DAY', receivedCalls: 145, answeredCalls: 140, abandonedCalls: 5, transactions: 58 },
    { date: '2026-01-25', time: '14:00', shift: 'DAY', receivedCalls: 175, answeredCalls: 165, abandonedCalls: 10, transactions: 72 },
    { date: '2026-01-25', time: '20:00', shift: 'NIGHT', receivedCalls: 105, answeredCalls: 100, abandonedCalls: 5, transactions: 42 },

    // Día 7
    { date: '2026-01-26', time: '08:00', shift: 'DAY', receivedCalls: 150, answeredCalls: 145, abandonedCalls: 5, transactions: 60 },
    { date: '2026-01-26', time: '14:00', shift: 'DAY', receivedCalls: 180, answeredCalls: 170, abandonedCalls: 10, transactions: 75 },
    { date: '2026-01-26', time: '20:00', shift: 'NIGHT', receivedCalls: 110, answeredCalls: 105, abandonedCalls: 5, transactions: 45 },
]

const slots: Slot[] = [
    { date: '2026-01-27', time: '08:00', shift: 'DAY', duration: 360 },
    { date: '2026-01-27', time: '14:00', shift: 'DAY', duration: 360 },
    { date: '2026-01-27', time: '20:00', shift: 'NIGHT', duration: 360 },
]

const plannedCapacity: PlannedCapacity[] = [
    { date: '2026-01-27', shift: 'DAY', plannedAgents: 10, expectedAdherence: 0.9, avgHandleTime: 300 },
    { date: '2026-01-27', shift: 'NIGHT', plannedAgents: 6, expectedAdherence: 0.85, avgHandleTime: 320 },
]

const input: PredictionInput = {
    slots,
    historicalData,
    plannedCapacity,
    config: {
        minHistoryDays: 7,
        horizonDays: 7,
        slotDuration: 30,
        weights: {
            recent: 3,
            intermediate: 2,
            old: 1
        }
    }
}

// ============================================
// EJECUTAR ENGINE
// ============================================

console.log('🧪 Prediction Engine - Synthetic Test\n')
console.log('📊 Input:')
console.log(`  - Historical days: ${new Set(historicalData.map(h => h.date)).size}`)
console.log(`  - Historical slots: ${historicalData.length}`)
console.log(`  - Prediction slots: ${slots.length}`)
console.log(`  - Planned capacity entries: ${plannedCapacity.length}\n`)

const output = PredictionEngine.execute(input)

console.log('📈 Output:\n')
console.log(`Confidence: ${output.confidence.level}`)
console.log(`Can Display: ${output.confidence.canDisplay}`)
console.log(`Message: ${output.confidence.uiMessage}`)
console.log(`Warnings: ${output.confidence.warnings.join(', ') || 'None'}\n`)

console.log(`Assumptions Base: ${output.assumptions.base.passed ? '✅ PASS' : '❌ FAIL'}`)
if (output.assumptions.base.failures.length > 0) {
    console.log(`  Failures: ${output.assumptions.base.failures.join(', ')}`)
}

console.log(`Assumptions Weak: ${output.assumptions.weak.passed ? '✅ PASS' : '⚠️ PARTIAL'}`)
if (output.assumptions.weak.warnings.length > 0) {
    console.log(`  Warnings: ${output.assumptions.weak.warnings.join(', ')}`)
}

console.log(`Anomalies: ${output.assumptions.anomalies.detected ? `⚠️ ${output.assumptions.anomalies.count} detected` : '✅ None'}`)
if (output.assumptions.anomalies.critical) {
    console.log(`  Critical: YES`)
}

console.log('\n📊 Per-Slot Predictions:\n')
output.perSlot.forEach(slot => {
    console.log(`${slot.slot.date} ${slot.slot.time} (${slot.slot.shift}):`)
    console.log(`  Volume: ${slot.volume.min} - ${slot.volume.expected} - ${slot.volume.max}`)
    console.log(`  Capacity: ${slot.capacity.availableCapacity} (${slot.capacity.effectiveAgents.toFixed(1)} agents)`)
    console.log(`  Gap: ${slot.gap.value > 0 ? '+' : ''}${slot.gap.value}`)
    console.log(`  Risk: ${slot.risk.riskLevel} (${slot.risk.riskType})`)
    if (slot.risk.impact.length > 0) {
        console.log(`  Impact: ${slot.risk.impact.join(', ')}`)
    }
    console.log('')
})

console.log('📋 Summary:\n')
console.log(`Worst Risk: ${output.summary.worstRisk}`)
console.log(`Affected Slots: ${output.summary.affectedSlots}`)
console.log(`Total Deficit: ${output.summary.totalDeficit}`)
console.log(`Total Surplus: ${output.summary.totalSurplus}`)

console.log('\n✅ Test completed successfully!')
