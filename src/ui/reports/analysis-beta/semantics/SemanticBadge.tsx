import { SemanticState } from "@/domain/reporting/semantics/correlation.semantics";

export default function SemanticBadge({ state }: { state: SemanticState }) {
    const map = {
        OK: { label: 'Normal', class: 'bg-green-100 text-green-700' },
        WATCH: { label: 'Atención', class: 'bg-yellow-100 text-yellow-700' },
        RISK: { label: 'Riesgo', class: 'bg-orange-100 text-orange-700' },
        CRITICAL: { label: 'Crítico', class: 'bg-red-100 text-red-700' },
        NO_DATA: { label: 'Sin datos', class: 'bg-gray-100 text-gray-500' },
    };

    const m = map[state];

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${m.class}`}>
            {m.label}
        </span>
    );
}
