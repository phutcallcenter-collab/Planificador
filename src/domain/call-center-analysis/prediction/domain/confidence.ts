// prediction/domain/confidence.ts

import {
    AssumptionsCheck,
    ConfidenceResult,
    HistoricalSlotData,
} from "./types";
import { detectTrend } from "./trend";

/**
 * Evaluador de confianza.
 * Responsabilidad: convertir supuestos + histórico + anomalías + tendencia en nivel de confianza.
 */

export function evaluateConfidence(
    assumptions: AssumptionsCheck,
    history: HistoricalSlotData[]
): ConfidenceResult {

    const reasons: string[] = [];

    // Paso 1: Supuestos base
    if (assumptions.base === "FAIL") {
        return { level: "INVALIDA", reasons: ["Base assumptions failed"] };
    }

    // Paso 2: Histórico mínimo
    const days = getUniqueDays(history).length;
    if (days < 7) {
        return { level: "INVALIDA", reasons: [`Insufficient historical data (${days} days)`] };
    }

    // Paso 3: Detectar tendencia sostenida
    const trendResult = detectTrend(history, 0.08); // 8% threshold
    const hasTrend = trendResult.detected;

    // Paso 4: Determinar nivel base por histórico
    let level: "ALTA" | "MEDIA" | "BAJA" = "BAJA";
    if (days >= 28 && assumptions.weak === "PASS") {
        level = "ALTA";
    } else if (days >= 14 && assumptions.weak !== "FAIL") {
        level = "MEDIA";
        reasons.push("Weak assumptions partially met");
    } else {
        reasons.push("Low historical depth or weak assumptions");
    }

    // Paso 5: DEGRADAR POR TENDENCIA
    if (hasTrend) {
        const originalLevel = level;
        level = degradeLevel(level);
        reasons.push(
            `Trend ${trendResult.direction} detected (${(trendResult.magnitude * 100).toFixed(1)}%). ` +
            `Base model does not capture trends. Confidence degraded: ${originalLevel} → ${level}`
        );
    }

    return {
        level,
        reasons,
    };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getUniqueDays(history: HistoricalSlotData[]): string[] {
    return Array.from(new Set(history.map(h => h.date)));
}

function degradeLevel(level: "ALTA" | "MEDIA" | "BAJA"): "ALTA" | "MEDIA" | "BAJA" {
    if (level === "ALTA") return "MEDIA";
    if (level === "MEDIA") return "BAJA";
    return level;
}
