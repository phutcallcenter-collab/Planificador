'use client';

import { useEffect } from 'react';
import { useOperationalDashboardStore } from '@/store/useOperationalDashboardStore';

export default function KPIObserver() {
    const { metrics } = useOperationalDashboardStore();

    // This component previously might have logged updates or triggered side effects.
    // For now, we keep it as a placeholder or simple logger.
    useEffect(() => {
        // Observer for side effects if needed in the future
    }, [metrics]);

    return null;
}
