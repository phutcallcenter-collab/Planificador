import { useAppStore } from "@/store/useAppStore";
import { DateRange } from "@/domain/reporting/types";
import { ExpectedCoverageSnapshot } from "@/domain/call-center-analysis/correlation/correlation.types";
import { getPlannedAgentsForDay } from "@/application/ui-adapters/getPlannedAgentsForDay";
import { eachDayOfInterval, parseISO, format } from "date-fns";

export function usePlannerContext(range: DateRange | null): ExpectedCoverageSnapshot[] {
    const {
        // weeklyPlan, // Removed
        allCalendarDaysForRelevantMonths, // Was calendarDays
        incidents,
        representatives,
        specialSchedules
    } = useAppStore();

    if (!range) return [];

    const days = eachDayOfInterval({
        start: parseISO(range.from),
        end: parseISO(range.to)
    });

    return days.flatMap(dateObj => {
        const date = format(dateObj, 'yyyy-MM-dd');

        // For now we map both shifts, though usually the analysis might be per day
        return (['DAY', 'NIGHT'] as const).map(shift => {
            const planned = getPlannedAgentsForDay(
                representatives, // Was weeklyPlan
                incidents,
                date,
                shift,
                allCalendarDaysForRelevantMonths,
                // representatives, // Removed
                specialSchedules
            );

            // Calculate Present Agents (Planned - Absences)
            const activeAbsences = incidents.filter(i =>
                i.type === 'AUSENCIA' &&
                i.startDate === date &&
                planned.some(p => p.representativeId === i.representativeId)
            );

            const present = planned.filter(p => !activeAbsences.some(i => i.representativeId === p.representativeId));

            return {
                date,
                shift,
                plannedAgents: planned.length,
                presentAgents: present.length,
                plannedAgentIds: planned.map(p => p.representativeId),
                // expectedCapacity: ... (Future: Sum of skills/percentages)
            };
        });
    });
}
