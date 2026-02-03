// prediction/domain/types.ts

export type SlotId = string; // ej: "2026-02-01T14:00"

export interface Slot {
    id: SlotId;
    start: string; // ISO
    end: string;   // ISO
    durationMinutes: number;
}

export interface HistoricalSlotData {
    slotId: SlotId;
    date: string; // YYYY-MM-DD
    volume: number;
    ahtSeconds: number;
    adherence?: number; // 0–1
}

export interface PlannedCapacity {
    slotId: SlotId;
    headcount: number;
}

export interface PredictionConfig {
    historicalWindowDays: number;
    minHistoryDaysHigh: number;   // 28
    minHistoryDaysMedium: number; // 14
    minHistoryDaysLow: number;    // 7
}

export interface PredictionInput {
    slots: Slot[];
    historicalData: HistoricalSlotData[];
    plannedCapacity: PlannedCapacity[];
    config: PredictionConfig;
}

export type AssumptionStatus = "PASS" | "PARTIAL" | "FAIL";

export interface AssumptionsCheck {
    base: AssumptionStatus;
    weak: AssumptionStatus;
    notes: string[];
}

export type ConfidenceLevel = "ALTA" | "MEDIA" | "BAJA" | "INVALIDA";

export interface ConfidenceResult {
    level: ConfidenceLevel;
    reasons: string[];
}

export interface ModelSlotResult {
    slotId: SlotId;
    expectedVolume: number;
    minVolume: number;
    maxVolume: number;
    capacity: number;
    gap: number;
}

export type RiskLevel =
    | "OK"
    | "BAJO"
    | "MEDIO"
    | "ALTO"
    | "CRITICO"
    | "INEFICIENCIA"
    | "SOBREDOTACION";

export interface RiskAssessment {
    slotId: SlotId;
    severity: "LEVE" | "MODERADO" | "SEVERO";
    persistence: number;
    riskLevel: RiskLevel;
    description: string;
}

export interface PredictionOutput {
    assumptions: AssumptionsCheck;
    confidence: ConfidenceResult;
    perSlot: Array<ModelSlotResult & { risk: RiskAssessment }>;
    summary: {
        worstRisk: RiskLevel;
        affectedSlots: number;
        notes: string[];
    };
}
