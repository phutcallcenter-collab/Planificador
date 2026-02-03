// prediction/domain/risk.ts

import { ModelSlotResult, RiskAssessment } from "./types";

export function assessRisk(
    results: ModelSlotResult[]
): RiskAssessment[] {
    let deficitStreak = 0;

    return results.map(r => {
        if (r.gap < 0) {
            deficitStreak++;
        } else {
            deficitStreak = 0;
        }

        const ratio = Math.abs(r.gap) / Math.max(r.expectedVolume, 1);

        let severity: RiskAssessment["severity"] = "LEVE";
        if (ratio > 0.12) severity = "SEVERO";
        else if (ratio >= 0.05) severity = "MODERADO";

        let riskLevel: RiskAssessment["riskLevel"] = "OK";

        if (r.gap < 0) {
            if (severity === "SEVERO") riskLevel = "CRITICO";
            else if (severity === "MODERADO" && deficitStreak >= 3)
                riskLevel = "ALTO";
            else if (deficitStreak >= 3) riskLevel = "MEDIO";
            else riskLevel = "BAJO";
        }

        return {
            slotId: r.slotId,
            severity,
            persistence: deficitStreak,
            riskLevel,
            description: `Gap ${r.gap.toFixed(1)} (${severity})`,
        };
    });
}
