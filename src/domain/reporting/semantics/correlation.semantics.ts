import { CorrelationFlag } from '@/domain/call-center-analysis/correlation/correlation.types';

export type SemanticState =
    | 'OK'
    | 'WATCH'
    | 'RISK'
    | 'CRITICAL'
    | 'NO_DATA';

export function deriveSemanticStatus(
    flags: CorrelationFlag[]
): SemanticState {
    if (flags.includes('NO_PLANNED_AGENTS')) return 'CRITICAL';
    if (flags.includes('OVERLOAD_SUSPECTED')) return 'CRITICAL';
    if (flags.includes('LOAD_INCREASING')) return 'RISK';
    if (flags.includes('UNDERUTILIZATION_SUSPECTED')) return 'WATCH';
    if (flags.includes('NO_BASELINE')) return 'WATCH';
    return 'OK';
}

export function mapCallsPerAgentState(
    value: number | undefined,
    baseline: number | null
): SemanticState {
    if (value === undefined) return 'NO_DATA';
    if (!baseline) return 'WATCH';

    if (value < baseline * 0.9) return 'OK';
    if (value < baseline * 1.1) return 'WATCH';
    if (value < baseline * 1.3) return 'RISK';
    return 'CRITICAL';
}

// Enhanced narrative builder
export function buildNarrative(
    metric: string,
    state: SemanticState,
    deltaPct?: number,
    flags: CorrelationFlag[] = []
): string {
    // Priority: Structural Issues (Zero Agents)
    if (flags.includes('NO_PLANNED_AGENTS')) return 'ERROR DE PLANIFICACIÓN: Turno sin cobertura asignada.';
    if (flags.includes('CALLS_WITHOUT_CAPACITY')) return 'CRÍTICO: Llamadas recibidas sin agentes. Posible error de carga.';

    // Secondary: Capacity Issues
    if (flags.includes('OVERLOAD_SUSPECTED')) {
        return deltaPct && deltaPct > 50
            ? 'Colapso operativo. La demanda supera la capacidad en >50%.'
            : 'Sobrecarga detectada. El equipo está saturado.';
    }
    if (flags.includes('UNDERUTILIZATION_SUSPECTED')) return 'Subutilización. Exceso de personal para la demanda actual.';

    // Default Fallback
    if (state === 'OK') return 'Operación balanceada. Carga acorde a la capacidad.';
    if (state === 'WATCH') return 'Ligera desviación. Monitorear tendencia.';
    if (state === 'RISK') return 'Carga elevada sostenida. Gestionar descansos.';
    if (state === 'CRITICAL') return 'Riesgo operativo alto. Reforzar turno.';
    return 'Datos insuficientes para diagnóstico.';
}
