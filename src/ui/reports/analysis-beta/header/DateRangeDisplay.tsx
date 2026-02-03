'use client';

import React from 'react';
import { useOperationalDashboardStore } from '@/store/useOperationalDashboardStore';
import { Calendar } from 'lucide-react';

/**
 * DateRangeDisplay
 * 
 * Muestra el rango de fechas validado de los tres archivos:
 * - Llamadas Contestadas
 * - Llamadas Abandonadas  
 * - Transacciones
 * 
 * Fuente única de verdad: useOperationalDashboardStore.scope.range
 * Este rango es validado por DateRangeValidationService para asegurar
 * que los tres archivos tengan fechas consistentes.
 */
export function DateRangeDisplay() {
    // Leer el rango validado del store
    const range = useOperationalDashboardStore(state => state.scope.range);

    // Si no hay rango (no se han cargado archivos), no mostrar nada
    if (!range || !range.from || !range.to) {
        return null;
    }

    const { from, to } = range;
    const isSingleDate = from === to;

    return (
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div className="flex flex-col">
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                    Período de Análisis
                </span>
                <span className="text-sm font-semibold text-blue-900">
                    {isSingleDate ? from : `${from} — ${to}`}
                </span>
            </div>
        </div>
    );
}
