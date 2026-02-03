'use client';

import { useOperationalDashboardStore } from '@/store/useOperationalDashboardStore';
import { Switch } from '@/ui/reports/analysis-beta/ui/switch';
import { Label } from '@/ui/reports/analysis-beta/ui/label';

export function DashboardControls() {
    const { showPrediction, togglePrediction } = useOperationalDashboardStore();

    return (
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-200">
            <Switch
                id="prediction-mode"
                checked={showPrediction}
                onCheckedChange={togglePrediction}
            />
            <Label htmlFor="prediction-mode" className="text-sm font-medium">
                Ver Predicción 2026
            </Label>
        </div>
    );
}
