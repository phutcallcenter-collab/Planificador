// prediction/domain/model.ts

import {
    Slot,
    HistoricalSlotData,
    PlannedCapacity,
    ModelSlotResult,
} from "./types";

/**
 * Extrae la hora del slotId (ej: "2026-01-15T14:00" -> "14:00")
 */
function extractTimeFromSlotId(slotId: string): string {
    const match = slotId.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : slotId;
}

export function calculateModel(
    slots: Slot[],
    historicalData: HistoricalSlotData[],
    plannedCapacity: PlannedCapacity[]
): ModelSlotResult[] {
    return slots.map(slot => {
        // Agrupar histórico por HORA, no por slotId exacto
        const slotTime = extractTimeFromSlotId(slot.id);
        const history = historicalData.filter(h =>
            extractTimeFromSlotId(h.slotId) === slotTime
        );

        const capacityPlan = plannedCapacity.find(p => p.slotId === slot.id);

        const volumes = history.map(h => h.volume);
        const mean =
            volumes.reduce((a, b) => a + b, 0) / Math.max(volumes.length, 1);

        const variance =
            volumes.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) /
            Math.max(volumes.length, 1);

        const sigma = Math.sqrt(variance);

        const avgAHT =
            history.reduce((a, h) => a + h.ahtSeconds, 0) /
            Math.max(history.length, 1);

        const avgAdherence =
            history
                .map(h => h.adherence ?? 1)
                .reduce((a, b) => a + b, 0) / Math.max(history.length, 1);

        const capacity =
            capacityPlan && avgAHT > 0
                ? capacityPlan.headcount *
                avgAdherence *
                (slot.durationMinutes * 60) /
                avgAHT
                : 0;

        return {
            slotId: slot.id,
            expectedVolume: mean,
            minVolume: mean - sigma,
            maxVolume: mean + sigma,
            capacity,
            gap: capacity - mean,
        };
    });
}
