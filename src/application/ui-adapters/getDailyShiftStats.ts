import { WeeklyPlan, Incident, ISODate, ShiftType, DayInfo, Representative, SpecialSchedule } from '@/domain/types'
import { getPlannedAgentsForDay } from './getPlannedAgentsForDay'
import { isSlotOperationallyEmpty } from '@/domain/planning/isSlotOperationallyEmpty'

/**
 * ⚠️ CANONICAL SOURCE OF TRUTH FOR DAILY SHIFT STATISTICS
 * 
 * This function defines the operational reality of the system.
 * DO NOT duplicate this logic in UI components, graphs, or reports.
 * 
 * All components that need planned/present counts MUST consume this function.
 * 
 * @returns { planned: number, present: number }
 * - planned: Agents scheduled to work (excludes LICENCIA/VACACIONES, includes AUSENCIA)
 * - present: Agents who actually showed up (planned - AUSENCIA)
 */
export function getDailyShiftStats(
    weeklyPlan: WeeklyPlan | null,
    incidents: Incident[],
    date: ISODate,
    shift: ShiftType,
    allCalendarDays: DayInfo[],
    representatives: Representative[],
    specialSchedules: SpecialSchedule[] = []
) {
    if (!weeklyPlan) {
        return { planned: 0, present: 0 }
    }

    // 1. Get Canonical Planned List
    const planned = getPlannedAgentsForDay(
        representatives, // Was weeklyPlan
        incidents,
        date,
        shift,
        allCalendarDays,
        // representatives, // Removed
        specialSchedules
    )

    // 2. Canonical Filter: Exclude Operationally Empty Slots from "Planned"
    // If a slot is OFF (Override) or Empty, it should not count towards the denominator.
    const effectivePlanned = planned.filter(p => {
        const isEmpty = isSlotOperationallyEmpty(
            p.representativeId,
            date,
            shift,
            incidents
        )
        // If it's explicitly OFF (isEmpty=true) AND it's not an absence (which counts as planned but not present),
        // we need to be careful.
        // isSlotOperationallyEmpty returns true for: OFF, VACACIONES, LICENCIA, AUSENCIA.

        // WAIT: "Planned" usually means "Expected to work".
        // - AUSENCIA: Expected to work (Planned=1), but didn't (Present=0).
        // - OFF: Not expected (Planned=0).
        // - VACACIONES: Not expected (Planned=0).

        // The current isSlotOperationallyEmpty implementation handles all these cases.
        // But for "Planned", we want to include people who *should* be there but are absent.

        // Let's look at isSlotOperationallyEmpty implementation...
        // If it returns true for AUSENCIA, then we can't use it directly to filter "Planned".

        // Actually, looking at present calculation below:
        // present = planned - absences.

        // If we filter planned using !isEmpty, we remove Absences from Planned too.
        // That would mean: Planned = 5, Absent = 1 -> Result: Planned = 4, Present = 4. 
        // That hides the absence.

        // We want: Planned = 5, Present = 4.

        // WE NEED A SPECIAL CHECK:
        // Exclude OFF, VACACIONES, LICENCIA.
        // Include AUSENCIA in Planned.

        // Let's refine the filter:
        const isAbsent = incidents.some(i =>
            i.representativeId === p.representativeId &&
            i.startDate === date &&
            i.type === 'AUSENCIA'
        )

        if (isAbsent) return true // Include in Planned

        // For others, use the standard check (OFF, VACATION, LICENSE -> isEmpty=true -> exclude)
        return !isEmpty
    })

    // 3. Calculate Present
    // Present = EffectivePlanned that are NOT absent
    const present = effectivePlanned.filter(p => {
        const isAbsent = incidents.some(i =>
            i.representativeId === p.representativeId &&
            i.startDate === date &&
            i.type === 'AUSENCIA'
        )
        return !isAbsent
    })

    return {
        planned: effectivePlanned.length,
        present: present.length,
    }
}
