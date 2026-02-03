// prediction/domain/assumptions.ts

import { HistoricalSlotData, AssumptionsCheck } from "./types";

export function evaluateAssumptions(
    historicalData: HistoricalSlotData[]
): AssumptionsCheck {
    const notes: string[] = [];

    if (historicalData.length === 0) {
        return {
            base: "FAIL",
            weak: "FAIL",
            notes: ["No historical data provided"],
        };
    }

    // Calidad mínima de datos
    const hasInvalidVolume = historicalData.some(d => d.volume < 0);
    const hasInvalidAHT = historicalData.some(d => d.ahtSeconds <= 0);

    if (hasInvalidVolume || hasInvalidAHT) {
        return {
            base: "FAIL",
            weak: "FAIL",
            notes: ["Invalid volume or AHT detected"],
        };
    }

    // Adherencia
    const adherenceValues = historicalData
        .map(d => d.adherence)
        .filter((a): a is number => a !== undefined);

    if (adherenceValues.length === 0) {
        notes.push("No adherence data: prediction marked optimistic");
        return {
            base: "PASS",
            weak: "PARTIAL",
            notes,
        };
    }

    return {
        base: "PASS",
        weak: "PASS",
        notes,
    };
}
