// prediction/domain/trend.ts

import { HistoricalSlotData } from './types'

/**
 * Resultado de detección de tendencia
 */
export interface TrendDetectionResult {
    detected: boolean
    direction: 'UP' | 'DOWN' | 'STABLE'
    magnitude: number // % de cambio acumulado
    slope: number // cambio promedio por día
}

/**
 * Detecta tendencia sostenida en datos históricos.
 * 
 * Método: Compara primera mitad vs segunda mitad del histórico.
 * Umbral: Si cambio acumulado >= threshold, hay tendencia.
 * 
 * Sin ML. Sin regresión. Solo aritmética brutal.
 */
export function detectTrend(
    historicalData: HistoricalSlotData[],
    threshold: number = 0.08 // 8% por defecto
): TrendDetectionResult {

    if (historicalData.length < 4) {
        return {
            detected: false,
            direction: 'STABLE',
            magnitude: 0,
            slope: 0
        }
    }

    // Ordenar por fecha
    const sorted = [...historicalData].sort((a, b) =>
        a.date.localeCompare(b.date)
    )

    // Dividir en dos mitades
    const mid = Math.floor(sorted.length / 2)
    const firstHalf = sorted.slice(0, mid)
    const secondHalf = sorted.slice(mid)

    // Calcular promedios
    const avgFirst = firstHalf.reduce((sum, h) => sum + h.volume, 0) / firstHalf.length
    const avgSecond = secondHalf.reduce((sum, h) => sum + h.volume, 0) / secondHalf.length

    // Calcular cambio relativo
    const change = avgSecond - avgFirst
    const magnitude = Math.abs(change) / Math.max(avgFirst, 1)

    // Calcular pendiente (cambio por día)
    const days = sorted.length
    const slope = change / Math.max(days / 2, 1)

    // Determinar dirección
    let direction: 'UP' | 'DOWN' | 'STABLE' = 'STABLE'
    if (magnitude >= threshold) {
        direction = change > 0 ? 'UP' : 'DOWN'
    }

    return {
        detected: magnitude >= threshold,
        direction,
        magnitude,
        slope
    }
}

/**
 * Valida consistencia de tendencia (opcional, más estricto)
 * 
 * Verifica que la tendencia sea sostenida, no volátil.
 * Cuenta cuántos días consecutivos van en la misma dirección.
 */
export function validateTrendConsistency(
    historicalData: HistoricalSlotData[],
    minConsecutiveDays: number = 3
): boolean {

    if (historicalData.length < minConsecutiveDays) return false

    const sorted = [...historicalData].sort((a, b) =>
        a.date.localeCompare(b.date)
    )

    let consecutiveUp = 0
    let consecutiveDown = 0
    let maxUp = 0
    let maxDown = 0

    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1].volume
        const curr = sorted[i].volume

        if (curr > prev) {
            consecutiveUp++
            consecutiveDown = 0
            maxUp = Math.max(maxUp, consecutiveUp)
        } else if (curr < prev) {
            consecutiveDown++
            consecutiveUp = 0
            maxDown = Math.max(maxDown, consecutiveDown)
        } else {
            consecutiveUp = 0
            consecutiveDown = 0
        }
    }

    return maxUp >= minConsecutiveDays || maxDown >= minConsecutiveDays
}

/**
 * Resultado de detección de variabilidad
 */
export interface VariabilityResult {
    level: 'ALTA' | 'MEDIA' | 'BAJA'
    coefficientOfVariation: number // CV as percentage
}

/**
 * Detecta variabilidad en datos históricos.
 * 
 * Método: Coefficient of Variation (CV) = (stdDev / mean) * 100
 * 
 * Thresholds:
 * - CV < 15% → BAJA (estable)
 * - CV 15-30% → MEDIA (moderada)
 * - CV > 30% → ALTA (volátil)
 * 
 * Descriptivo, no predictivo. No evalúa causas.
 */
export function detectVariability(
    historicalData: HistoricalSlotData[]
): VariabilityResult {

    if (historicalData.length < 2) {
        return {
            level: 'BAJA',
            coefficientOfVariation: 0
        }
    }

    // Extract volumes
    const volumes = historicalData.map(h => h.volume)

    // Calculate mean
    const mean = volumes.reduce((sum, v) => sum + v, 0) / volumes.length

    // Calculate standard deviation
    const squaredDiffs = volumes.map(v => Math.pow(v - mean, 2))
    const variance = squaredDiffs.reduce((sum, sd) => sum + sd, 0) / volumes.length
    const stdDev = Math.sqrt(variance)

    // Calculate coefficient of variation (as percentage)
    const cv = mean > 0 ? (stdDev / mean) * 100 : 0

    // Classify
    let level: 'ALTA' | 'MEDIA' | 'BAJA'
    if (cv > 30) {
        level = 'ALTA'
    } else if (cv > 15) {
        level = 'MEDIA'
    } else {
        level = 'BAJA'
    }

    return {
        level,
        coefficientOfVariation: cv
    }
}
