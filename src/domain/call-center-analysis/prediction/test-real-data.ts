/**
 * Real Data Validation Test
 * 
 * Integra el Prediction Engine v2 con datos reales del sistema.
 * NO limpia datos. NO maquilla resultados.
 * 
 * Objetivo: Descubrir dónde y cómo el engine miente consistentemente.
 */

import { runPredictionEngine } from './engine/PredictionEngine'
import { validatePrediction } from './validation/validatePrediction'
import {
    PredictionInput,
    HistoricalSlotData,
    Slot,
    PlannedCapacity,
} from './domain/types'
import { ActualOperationalLoad } from '../adapter/OperationalCorrelationAdapter'

/**
 * Convierte ActualOperationalLoad a HistoricalSlotData
 */
function convertToHistoricalData(
    loads: ActualOperationalLoad[]
): HistoricalSlotData[] {
    return loads.map(load => {
        // Generar slotId basado en shift (asumiendo franjas fijas)
        const timeSlot = load.shift === 'DAY' ? '14:00' : '20:00'
        const slotId = `${load.date}T${timeSlot}`

        return {
            slotId,
            date: load.date,
            volume: load.receivedCalls,
            ahtSeconds: 300, // Asumido: 5 min promedio (sin datos reales)
            adherence: undefined, // No disponible en datos actuales
        }
    })
}

/**
 * Ejecuta validación con datos reales
 */
export function runRealDataValidation(
    historicalLoads: ActualOperationalLoad[],
    futureLoads: ActualOperationalLoad[],
    plannedAgents: { date: string; shift: 'DAY' | 'NIGHT'; headcount: number }[]
) {
    console.log('═══════════════════════════════════════════════════════')
    console.log('  Prediction Engine v2 - Real Data Validation')
    console.log('═══════════════════════════════════════════════════════\n')

    // Convertir datos
    const historicalData = convertToHistoricalData(historicalLoads)

    // Crear slots para predicción
    const slots: Slot[] = futureLoads.map(load => {
        const timeSlot = load.shift === 'DAY' ? '14:00' : '20:00'
        const slotId = `${load.date}T${timeSlot}`

        return {
            id: slotId,
            start: `${load.date}T${timeSlot}:00`,
            end: load.shift === 'DAY' ? `${load.date}T20:00:00` : `${load.date}T02:00:00`,
            durationMinutes: 360,
        }
    })

    // Crear capacidad planificada
    const plannedCapacity: PlannedCapacity[] = plannedAgents.map(p => {
        const timeSlot = p.shift === 'DAY' ? '14:00' : '20:00'
        const slotId = `${p.date}T${timeSlot}`

        return {
            slotId,
            headcount: p.headcount,
        }
    })

    const input: PredictionInput = {
        slots,
        historicalData,
        plannedCapacity,
        config: {
            historicalWindowDays: historicalData.length,
            minHistoryDaysHigh: 28,
            minHistoryDaysMedium: 14,
            minHistoryDaysLow: 7,
        },
    }

    console.log('📊 Input Summary:')
    console.log(`  Historical days: ${new Set(historicalData.map(h => h.date)).size}`)
    console.log(`  Historical slots: ${historicalData.length}`)
    console.log(`  Prediction slots: ${slots.length}`)
    console.log(`  Planned capacity entries: ${plannedCapacity.length}\n`)

    // Ejecutar engine
    const output = runPredictionEngine(input)

    console.log('📈 Prediction Output:\n')
    console.log(`Confidence: ${output.confidence.level}`)
    console.log(`Reasons: ${output.confidence.reasons.join(', ') || 'None'}`)
    console.log(`Assumptions Base: ${output.assumptions.base}`)
    console.log(`Assumptions Weak: ${output.assumptions.weak}`)
    console.log(`Assumptions Notes: ${output.assumptions.notes.join(', ') || 'None'}`)
    console.log(`Worst Risk: ${output.summary.worstRisk}`)
    console.log(`Affected Slots: ${output.summary.affectedSlots}\n`)

    if (output.perSlot.length === 0) {
        console.log('⚠️ No predictions generated (confidence INVALID)\n')
        return
    }

    // Preparar datos reales para validación
    const realData = futureLoads.map(load => {
        const timeSlot = load.shift === 'DAY' ? '14:00' : '20:00'
        const slotId = `${load.date}T${timeSlot}`

        return {
            slotId,
            realVolume: load.receivedCalls,
        }
    })

    // Validar
    const validation = validatePrediction(output, realData)

    console.log('🧪 Validation Results:\n')
    console.log(`MAE (Mean Absolute Error): ${validation.metrics.mae.toFixed(2)}`)
    console.log(`MAPE (Mean Abs % Error): ${(validation.metrics.mape * 100).toFixed(2)}%`)
    console.log(`Bias: ${validation.metrics.bias.toFixed(2)}`)
    console.log(`Coverage: ${(validation.metrics.coverage * 100).toFixed(2)}%`)
    console.log(`Verdict: ${validation.verdict}`)
    console.log(`Notes: ${validation.notes.join(', ') || 'None'}\n`)

    // Detalle por slot
    console.log('📋 Per-Slot Analysis:\n')

    const byShift = {
        DAY: { errors: [] as number[], coverageCount: 0, total: 0 },
        NIGHT: { errors: [] as number[], coverageCount: 0, total: 0 }
    }

    output.perSlot.forEach((pred, i) => {
        const real = realData.find(r => r.slotId === pred.slotId)
        if (!real) return

        const error = real.realVolume - pred.expectedVolume
        const shift = pred.slotId.includes('T14:') ? 'DAY' : 'NIGHT'
        const covered = real.realVolume >= pred.minVolume && real.realVolume <= pred.maxVolume

        byShift[shift].errors.push(error)
        byShift[shift].total++
        if (covered) byShift[shift].coverageCount++

        console.log(`${pred.slotId}:`)
        console.log(`  Predicted: ${pred.expectedVolume.toFixed(0)} (${pred.minVolume.toFixed(0)}-${pred.maxVolume.toFixed(0)})`)
        console.log(`  Real: ${real.realVolume}`)
        console.log(`  Error: ${error > 0 ? '+' : ''}${error.toFixed(0)}`)
        console.log(`  Covered: ${covered ? '✅' : '❌'}`)
        console.log(`  Gap: ${pred.gap.toFixed(0)} | Risk: ${pred.risk.riskLevel}`)
        console.log('')
    })

    // Análisis por turno
    console.log('🔍 Analysis by Shift:\n')

    for (const [shift, data] of Object.entries(byShift)) {
        if (data.total === 0) continue

        const avgError = data.errors.reduce((a, b) => a + b, 0) / data.total
        const coverage = data.coverageCount / data.total

        console.log(`${shift}:`)
        console.log(`  Samples: ${data.total}`)
        console.log(`  Avg Error: ${avgError > 0 ? '+' : ''}${avgError.toFixed(2)}`)
        console.log(`  Coverage: ${(coverage * 100).toFixed(0)}%`)
        console.log('')
    }

    console.log('═══════════════════════════════════════════════════════')
    console.log('  ⚠️ BUSCAR:')
    console.log('  - Bias por franja (DAY vs NIGHT)')
    console.log('  - Coverage vs Confianza (ALTA con coverage baja = problema)')
    console.log('  - Errores estructurales (siempre falla X día)')
    console.log('═══════════════════════════════════════════════════════\n')
}

// ============================================
// EJEMPLO DE USO (comentado, para referencia)
// ============================================

/*
// Datos históricos (14-28 días)
const historicalLoads: ActualOperationalLoad[] = [
  { date: '2026-01-01', shift: 'DAY', receivedCalls: 120, answeredCalls: 115, abandonedCalls: 5, transactions: 45 },
  { date: '2026-01-01', shift: 'NIGHT', receivedCalls: 80, answeredCalls: 75, abandonedCalls: 5, transactions: 30 },
  // ... más días
]

// Datos futuros (3-7 días para validar)
const futureLoads: ActualOperationalLoad[] = [
  { date: '2026-01-15', shift: 'DAY', receivedCalls: 125, answeredCalls: 120, abandonedCalls: 5, transactions: 48 },
  { date: '2026-01-15', shift: 'NIGHT', receivedCalls: 85, answeredCalls: 80, abandonedCalls: 5, transactions: 32 },
  // ... más días
]

// Capacidad planificada
const plannedAgents = [
  { date: '2026-01-15', shift: 'DAY', headcount: 10 },
  { date: '2026-01-15', shift: 'NIGHT', headcount: 6 },
  // ... más días
]

runRealDataValidation(historicalLoads, futureLoads, plannedAgents)
*/
