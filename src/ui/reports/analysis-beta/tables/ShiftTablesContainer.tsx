'use client';

import { useOperationalDashboardStore } from '@/store/useOperationalDashboardStore';
import ShiftDetailTable from './ShiftDetailTable';
import { getShift } from '@/domain/call-center-analysis/shift.service';

export default function ShiftTablesContainer() {
    const { data } = useOperationalDashboardStore();

    if (!data?.answered) return null;

    // Filter data by shift - Using the pre-calculated 'turno' field from parser
    const dayAnswered = data.answered.filter(c => c.turno === 'Día');
    const nightAnswered = data.answered.filter(c => c.turno === 'Noche');

    // Using RAW abandoned for shift tables as requested
    const dayAbandoned = data.abandoned.raw.filter(c => c.turno === 'Día');
    const nightAbandoned = data.abandoned.raw.filter(c => c.turno === 'Noche');

    // For transactions, we derive shift from hour using canonical logic (needs date)
    // IMPORTANT: Filter by platform 'Call Center' to only show agent-handled sales
    const dayTransactions = data.transactions.filter(t =>
        t.plataforma === 'Call Center' && getShift(t.hora, t.fecha) === 'Día'
    );
    const nightTransactions = data.transactions.filter(t =>
        t.plataforma === 'Call Center' && getShift(t.hora, t.fecha) === 'Noche'
    );

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ShiftDetailTable
                title="Turno Día (09:00 - 15:30)"
                answered={dayAnswered}
                abandoned={dayAbandoned}
                transactions={dayTransactions}
            />
            <ShiftDetailTable
                title="Turno Noche (16:00 - CIERRE)"
                answered={nightAnswered}
                abandoned={nightAbandoned}
                transactions={nightTransactions}
            />
        </div>
    );
}
