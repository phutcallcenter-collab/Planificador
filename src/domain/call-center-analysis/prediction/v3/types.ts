// prediction/v3/types.ts

/**
 * v3 Weekly Prediction Types
 * 
 * Output contract for weekly operational planning.
 * Focuses on relative changes and peak identification.
 */

export type ISODate = string // "2026-02-03"
export type ISOTimestamp = string // "2026-02-03T14:30:00Z"
export type ConfidenceLevel = "ALTA" | "MEDIA" | "BAJA" | "INVALIDA"

/**
 * Day severity classification (relative to weekly baseline)
 * 
 * CRITICAL: Severity is based SOLELY on relativeChange, not absolute volume.
 * A "CRITICAL" day in a quiet week may have lower volume than a "NORMAL" day in a busy week.
 */
export type DaySeverity =
    | 'NORMAL'      // ±5% vs baseline
    | 'ELEVATED'    // 5-10% vs baseline
    | 'CRITICAL'    // >10% vs baseline

/**
 * Weekly prediction output for operational planning.
 */
export interface WeeklyPrediction {
    /** Fixed 7-day horizon */
    horizon: {
        start: ISODate
        end: ISODate
        days: 7 // Always 7
    }

    /** 
     * Baseline derived from v2 model (no trend adjustment).
     * This is the reference point for all relative changes.
     */
    baseline: {
        avgDailyVolume: number
        source: 'v2_model' // Explicit: not learned, derived
        confidence: ConfidenceLevel
        historicalDays: number
    }

    /** 
     * Daily outlook with relative changes.
     * 
     * CRITICAL: Severity levels are relative to THIS week's baseline,
     * not absolute thresholds.
     */
    dailyOutlook: Array<{
        date: ISODate
        dayOfWeek: string // "Lunes", "Martes", etc.
        relativeChange: number // % vs baseline (can be negative)
        severity: DaySeverity
        /**
         * Approximate reference volume (baseline * (1 + relativeChange))
         * NOT a precise forecast. Only shown if confidence >= MEDIA.
         */
        predictedVolume?: number
        note?: string
    }>

    summary: {
        peakDay: ISODate
        peakChange: number // % change of peak day
        /**
         * Trend direction (inter-weekly): UP/DOWN/STABLE
         * Independent from severity (intra-weekly pressure)
         */
        trendDirection: 'UP' | 'DOWN' | 'STABLE'
        /**
         * Variability level (NEW: Fix 1)
         * Describes volatility, not trend direction
         */
        variability: 'ALTA' | 'MEDIA' | 'BAJA'
        confidence: ConfidenceLevel
        assumptions: string[]
        warnings: string[]
    }

    /** Metadata for auditing */
    meta: {
        generatedAt: ISOTimestamp
        modelVersion: 'v3'
        baseModelVersion: 'v2'
        trendDetected: boolean
        trendMagnitude?: number
    }
}

/**
 * Input for weekly prediction generation
 */
export interface WeeklyPredictionInput {
    /** Start date of the 7-day horizon */
    startDate: ISODate

    /** Historical data (from v2) */
    historicalData: Array<{
        date: ISODate
        volume: number
    }>

    /** v2 baseline and confidence */
    v2Baseline: {
        avgVolume: number
        confidence: ConfidenceLevel
        historicalDays: number
    }

    /** v2 trend detection result */
    v2Trend: {
        detected: boolean
        direction: 'UP' | 'DOWN' | 'STABLE'
        magnitude: number
    }

    /** v2 variability detection result (NEW: Fix 1) */
    v2Variability: {
        level: 'ALTA' | 'MEDIA' | 'BAJA'
        coefficientOfVariation: number
    }
}
