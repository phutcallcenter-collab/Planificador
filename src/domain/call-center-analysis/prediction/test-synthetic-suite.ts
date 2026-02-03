/**
 * Prediction Engine v2 - Synthetic Test Suite
 * 
 * Objetivo: Verificar coherencia interna del engine.
 * NO valida precisión contra realidad, valida lógica interna.
 * 
 * Escenarios:
 * 1. Volumen plano → bias ~0, coverage alta
 * 2. Volumen creciente → bias negativo (subestimación)
 * 3. σ pequeño → coverage baja (rango estrecho)
 * 4. Gaps encadenados → riesgo alto
 * 5. Datos insuficientes → confianza INVALIDA
 */

import { runPredictionEngine } from './engine/PredictionEngine'
import { validatePrediction } from './validation/validatePrediction'
import {
    PredictionInput,
    HistoricalSlotData,
    Slot,
    PlannedCapacity,
} from './domain/types'

// ============================================
// ESCENARIO 1: Volumen Plano (Baseline)
// ============================================

function testScenario1_FlatVolume() {
    console.log('\n🧪 ESCENARIO 1: Volumen Plano')
    console.log('Expectativa: bias ~0, coverage alta, confianza ALTA\n')

    const historicalData: HistoricalSlotData[] = []
    const slots: Slot[] = []
    const plannedCapacity: PlannedCapacity[] = []

    // 28 días de histórico (volumen constante = 100)
    for (let day = 1; day <= 28; day++) {
        const date = `2026-01-${String(day).padStart(2, '0')}`
        const slotId = `${date}T14:00`

        historicalData.push({
            slotId,
            date,
            volume: 100, // Constante
            ahtSeconds: 300,
            adherence: 0.9,
        })
    }

    // Predecir 3 días futuros
    for (let day = 29; day <= 31; day++) {
        const date = `2026-01-${String(day).padStart(2, '0')}`
        const slotId = `${date}T14:00`

        slots.push({
            id: slotId,
            start: `${date}T14:00:00`,
            end: `${date}T20:00:00`,
            durationMinutes: 360,
        })

        plannedCapacity.push({
            slotId,
            headcount: 10,
        })
    }

    const input: PredictionInput = {
        slots,
        historicalData,
        plannedCapacity,
        config: {
            historicalWindowDays: 28,
            minHistoryDaysHigh: 28,
            minHistoryDaysMedium: 14,
            minHistoryDaysLow: 7,
        },
    }

    const output = runPredictionEngine(input)

    console.log(`Confianza: ${output.confidence.level}`)
    console.log(`Supuestos Base: ${output.assumptions.base}`)
    console.log(`Supuestos Débiles: ${output.assumptions.weak}`)
    console.log(`Peor Riesgo: ${output.summary.worstRisk}`)
    console.log(`Slots Afectados: ${output.summary.affectedSlots}`)

    // Simular "realidad" = volumen sigue plano
    const realData = slots.map(s => ({
        slotId: s.id,
        realVolume: 100,
    }))

    const validation = validatePrediction(output, realData)
    console.log(`\nValidación:`)
    console.log(`  MAE: ${validation.metrics.mae.toFixed(2)}`)
    console.log(`  MAPE: ${(validation.metrics.mape * 100).toFixed(2)}%`)
    console.log(`  Bias: ${validation.metrics.bias.toFixed(2)}`)
    console.log(`  Coverage: ${(validation.metrics.coverage * 100).toFixed(2)}%`)
    console.log(`  Veredicto: ${validation.verdict}`)

    console.log('\n✅ Esperado: MAE bajo, Bias ~0, Coverage alta')
}

// ============================================
// ESCENARIO 2: Volumen Creciente
// ============================================

function testScenario2_GrowingVolume() {
    console.log('\n🧪 ESCENARIO 2: Volumen Creciente')
    console.log('Expectativa: bias negativo (subestimación), coverage media\n')

    const historicalData: HistoricalSlotData[] = []
    const slots: Slot[] = []
    const plannedCapacity: PlannedCapacity[] = []

    // 14 días de histórico (volumen creciente: 100 → 127)
    for (let day = 1; day <= 14; day++) {
        const date = `2026-01-${String(day).padStart(2, '0')}`
        const slotId = `${date}T14:00`

        historicalData.push({
            slotId,
            date,
            volume: 100 + day * 2, // Crecimiento lineal
            ahtSeconds: 300,
            adherence: 0.9,
        })
    }

    // Predecir 3 días futuros
    for (let day = 15; day <= 17; day++) {
        const date = `2026-01-${String(day).padStart(2, '0')}`
        const slotId = `${date}T14:00`

        slots.push({
            id: slotId,
            start: `${date}T14:00:00`,
            end: `${date}T20:00:00`,
            durationMinutes: 360,
        })

        plannedCapacity.push({
            slotId,
            headcount: 10,
        })
    }

    const input: PredictionInput = {
        slots,
        historicalData,
        plannedCapacity,
        config: {
            historicalWindowDays: 14,
            minHistoryDaysHigh: 28,
            minHistoryDaysMedium: 14,
            minHistoryDaysLow: 7,
        },
    }

    const output = runPredictionEngine(input)

    console.log(`Confianza: ${output.confidence.level}`)
    console.log(`Peor Riesgo: ${output.summary.worstRisk}`)

    // Simular "realidad" = volumen sigue creciendo
    const realData = slots.map((s, i) => ({
        slotId: s.id,
        realVolume: 100 + (15 + i) * 2, // Continúa crecimiento
    }))

    const validation = validatePrediction(output, realData)
    console.log(`\nValidación:`)
    console.log(`  MAE: ${validation.metrics.mae.toFixed(2)}`)
    console.log(`  Bias: ${validation.metrics.bias.toFixed(2)}`)
    console.log(`  Coverage: ${(validation.metrics.coverage * 100).toFixed(2)}%`)
    console.log(`  Veredicto: ${validation.verdict}`)

    console.log('\n✅ Esperado: Bias negativo (modelo subestima crecimiento)')
}

// ============================================
// ESCENARIO 3: σ Pequeño (Volumen Estable)
// ============================================

function testScenario3_LowVariance() {
    console.log('\n🧪 ESCENARIO 3: σ Pequeño (Volumen Muy Estable)')
    console.log('Expectativa: coverage baja (rango estrecho), confianza MEDIA\n')

    const historicalData: HistoricalSlotData[] = []
    const slots: Slot[] = []
    const plannedCapacity: PlannedCapacity[] = []

    // 14 días de histórico (volumen muy estable: 100 ± 2)
    for (let day = 1; day <= 14; day++) {
        const date = `2026-01-${String(day).padStart(2, '0')}`
        const slotId = `${date}T14:00`

        historicalData.push({
            slotId,
            date,
            volume: 100 + (Math.random() * 4 - 2), // Variación mínima
            ahtSeconds: 300,
            adherence: 0.9,
        })
    }

    // Predecir 3 días futuros
    for (let day = 15; day <= 17; day++) {
        const date = `2026-01-${String(day).padStart(2, '0')}`
        const slotId = `${date}T14:00`

        slots.push({
            id: slotId,
            start: `${date}T14:00:00`,
            end: `${date}T20:00:00`,
            durationMinutes: 360,
        })

        plannedCapacity.push({
            slotId,
            headcount: 10,
        })
    }

    const input: PredictionInput = {
        slots,
        historicalData,
        plannedCapacity,
        config: {
            historicalWindowDays: 14,
            minHistoryDaysHigh: 28,
            minHistoryDaysMedium: 14,
            minHistoryDaysLow: 7,
        },
    }

    const output = runPredictionEngine(input)

    console.log(`Confianza: ${output.confidence.level}`)
    console.log(`Rango típico: ${output.perSlot[0]?.minVolume.toFixed(0)} - ${output.perSlot[0]?.maxVolume.toFixed(0)}`)

    // Simular "realidad" = volumen salta fuera del rango estrecho
    const realData = slots.map(s => ({
        slotId: s.id,
        realVolume: 110, // Fuera del rango estrecho
    }))

    const validation = validatePrediction(output, realData)
    console.log(`\nValidación:`)
    console.log(`  Coverage: ${(validation.metrics.coverage * 100).toFixed(2)}%`)
    console.log(`  Veredicto: ${validation.verdict}`)

    console.log('\n✅ Esperado: Coverage baja (rango estrecho no captura variación real)')
}

// ============================================
// ESCENARIO 4: Gaps Encadenados (Déficit)
// ============================================

function testScenario4_ChainedDeficits() {
    console.log('\n🧪 ESCENARIO 4: Gaps Encadenados (Déficit Sostenido)')
    console.log('Expectativa: riesgo ALTO o CRÍTICO\n')

    const historicalData: HistoricalSlotData[] = []
    const slots: Slot[] = []
    const plannedCapacity: PlannedCapacity[] = []

    // 14 días de histórico (volumen alto: 200)
    for (let day = 1; day <= 14; day++) {
        const date = `2026-01-${String(day).padStart(2, '0')}`
        const slotId = `${date}T14:00`

        historicalData.push({
            slotId,
            date,
            volume: 200,
            ahtSeconds: 300,
            adherence: 0.9,
        })
    }

    // Predecir 5 días futuros con capacidad BAJA (genera déficit)
    for (let day = 15; day <= 19; day++) {
        const date = `2026-01-${String(day).padStart(2, '0')}`
        const slotId = `${date}T14:00`

        slots.push({
            id: slotId,
            start: `${date}T14:00:00`,
            end: `${date}T20:00:00`,
            durationMinutes: 360,
        })

        plannedCapacity.push({
            slotId,
            headcount: 2, // Capacidad MUY insuficiente (genera déficit)
        })
    }

    const input: PredictionInput = {
        slots,
        historicalData,
        plannedCapacity,
        config: {
            historicalWindowDays: 14,
            minHistoryDaysHigh: 28,
            minHistoryDaysMedium: 14,
            minHistoryDaysLow: 7,
        },
    }

    const output = runPredictionEngine(input)

    console.log(`Confianza: ${output.confidence.level}`)
    console.log(`Peor Riesgo: ${output.summary.worstRisk}`)
    console.log(`Slots Afectados: ${output.summary.affectedSlots}`)

    output.perSlot.forEach((s, i) => {
        console.log(`  Slot ${i + 1}: Gap=${s.gap.toFixed(0)}, Riesgo=${s.risk.riskLevel}, Persistencia=${s.risk.persistence}`)
    })

    console.log('\n✅ Esperado: Riesgo ALTO/CRÍTICO, persistencia creciente')
}

// ============================================
// ESCENARIO 5: Datos Insuficientes
// ============================================

function testScenario5_InsufficientData() {
    console.log('\n🧪 ESCENARIO 5: Datos Insuficientes')
    console.log('Expectativa: confianza INVALIDA, perSlot vacío\n')

    const historicalData: HistoricalSlotData[] = []
    const slots: Slot[] = []
    const plannedCapacity: PlannedCapacity[] = []

    // Solo 3 días de histórico (< 7 mínimo)
    for (let day = 1; day <= 3; day++) {
        const date = `2026-01-0${day}`
        const slotId = `${date}T14:00`

        historicalData.push({
            slotId,
            date,
            volume: 100,
            ahtSeconds: 300,
            adherence: 0.9,
        })
    }

    // Intentar predecir
    const date = '2026-01-04'
    const slotId = `${date}T14:00`

    slots.push({
        id: slotId,
        start: `${date}T14:00:00`,
        end: `${date}T20:00:00`,
        durationMinutes: 360,
    })

    plannedCapacity.push({
        slotId,
        headcount: 10,
    })

    const input: PredictionInput = {
        slots,
        historicalData,
        plannedCapacity,
        config: {
            historicalWindowDays: 3,
            minHistoryDaysHigh: 28,
            minHistoryDaysMedium: 14,
            minHistoryDaysLow: 7,
        },
    }

    const output = runPredictionEngine(input)

    console.log(`Confianza: ${output.confidence.level}`)
    console.log(`Razones: ${output.confidence.reasons.join(', ')}`)
    console.log(`Slots Predichos: ${output.perSlot.length}`)

    console.log('\n✅ Esperado: INVALIDA, perSlot vacío')
}

// ============================================
// EJECUTAR TODOS LOS ESCENARIOS
// ============================================

console.log('═══════════════════════════════════════════════════════')
console.log('  Prediction Engine v2 - Synthetic Test Suite')
console.log('═══════════════════════════════════════════════════════')

testScenario1_FlatVolume()
testScenario2_GrowingVolume()
testScenario3_LowVariance()
testScenario4_ChainedDeficits()
testScenario5_InsufficientData()

console.log('\n═══════════════════════════════════════════════════════')
console.log('  ✅ Test Suite Completado')
console.log('═══════════════════════════════════════════════════════\n')
