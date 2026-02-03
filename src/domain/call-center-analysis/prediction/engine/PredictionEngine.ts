// prediction/engine/predictionEngine.ts

import {
    PredictionInput,
    PredictionOutput,
} from "../domain/types";
import { evaluateAssumptions } from "../domain/assumptions";
import { calculateModel } from "../domain/model";
import { assessRisk } from "../domain/risk";
import { evaluateConfidence } from "../domain/confidence";

export function runPredictionEngine(
    input: PredictionInput
): PredictionOutput {
    const assumptions = evaluateAssumptions(input.historicalData);

    const confidence = evaluateConfidence(
        assumptions,
        input.historicalData // Pass full historical data for trend detection
    );

    if (confidence.level === "INVALIDA") {
        return {
            assumptions,
            confidence,
            perSlot: [],
            summary: {
                worstRisk: "OK",
                affectedSlots: 0,
                notes: ["Prediction invalid"],
            },
        };
    }

    const modelResults = calculateModel(
        input.slots,
        input.historicalData,
        input.plannedCapacity
    );

    const risks = assessRisk(modelResults);

    const perSlot = modelResults.map((m, i) => ({
        ...m,
        risk: risks[i],
    }));

    const worstRisk = risks.reduce<typeof risks[0]["riskLevel"]>(
        (acc, r) =>
            acc === "CRITICO" || r.riskLevel === "CRITICO"
                ? "CRITICO"
                : r.riskLevel,
        "OK"
    );

    return {
        assumptions,
        confidence,
        perSlot,
        summary: {
            worstRisk,
            affectedSlots: risks.filter(r => r.riskLevel !== "OK").length,
            notes: confidence.reasons,
        },
    };
}
