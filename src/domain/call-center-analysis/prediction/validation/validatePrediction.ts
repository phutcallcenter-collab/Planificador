// prediction/validation/validatePrediction.ts

import { PredictionOutput } from "../domain/types";

interface RealSlot {
    slotId: string;
    realVolume: number;
}

export interface ValidationResult {
    window: {
        trainDays: number;
        validationDays: number;
    };
    metrics: {
        mae: number;
        mape: number;
        bias: number;
        coverage: number;
    };
    byConfidence: Record<
        "ALTA" | "MEDIA" | "BAJA",
        {
            mae: number;
            coverage: number;
            samples: number;
        }
    >;
    verdict:
    | "OK"
    | "SESGO_DETECTADO"
    | "MODELO_INESTABLE"
    | "NO_CONFIABLE";
    notes: string[];
}

export function validatePrediction(
    prediction: PredictionOutput,
    realData: RealSlot[]
): Omit<ValidationResult, 'window' | 'byConfidence'> {
    const errors: number[] = [];
    const percentageErrors: number[] = [];
    let covered = 0;
    let validSlots = 0; // Only count slots with real data

    prediction.perSlot.forEach(p => {
        const real = realData.find(r => r.slotId === p.slotId);
        if (!real) return; // Skip slots without real data

        validSlots++; // Count this slot as valid for validation

        const error = real.realVolume - p.expectedVolume;
        errors.push(error);

        // MAPE: use actual real volume from lookup, not index
        const percentageError = Math.abs(error) / Math.max(real.realVolume, 1);
        percentageErrors.push(percentageError);

        if (
            real.realVolume >= p.minVolume &&
            real.realVolume <= p.maxVolume
        ) {
            covered++;
        }
    });

    const mae =
        errors.reduce((a, b) => a + Math.abs(b), 0) /
        Math.max(errors.length, 1);

    const bias =
        errors.reduce((a, b) => a + b, 0) /
        Math.max(errors.length, 1);

    // Coverage: only count slots with real data (strict)
    const coverage = covered / Math.max(validSlots, 1);

    // MAPE: average of percentage errors
    const mape = percentageErrors.reduce((a, b) => a + b, 0) / Math.max(percentageErrors.length, 1);

    let verdict: ValidationResult["verdict"] = "OK";
    const notes: string[] = [];

    if (Math.abs(bias) / Math.max(mae, 1) > 0.5) {
        verdict = "SESGO_DETECTADO";
        notes.push("Systematic bias detected");
    }

    if (coverage < 0.4) {
        verdict = "NO_CONFIABLE";
        notes.push("Range coverage too low");
    }

    return {
        metrics: { mae, bias, coverage, mape },
        verdict,
        notes,
    };
}
