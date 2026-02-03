import {
    WeeklyPlan,
    Incident,
    ISODate,
    ShiftType,
    DayInfo,
    Representative,
    SpecialSchedule,
} from '@/domain/types'
import { resolveIncidentDates } from '@/domain/incidents/resolveIncidentDates'
import { getEffectiveSchedule } from '@/application/scheduling/specialScheduleAdapter'

export interface PlannedAgent {
    representativeId: string
    shift: ShiftType
    source: 'BASE' | 'EFFECTIVE_PERIOD' | 'SWAP'
}

/**
 * ⚠️ CANONICAL SOURCE OF TRUTH FOR PLANNED AGENTS
 * 
 * Calculates the canonical list of agents PLANNED to work on a specific day and shift.
 * 
 * Definition of PLANNED:
 * 1. Has an effective assignment (Base Schedule or Effective Period).
 * 2. Is NOT blocked by Vacation or License.
 * 3. Absences do NOT remove them from the planned list (they are planned but absent).
 * 
 * This function serves as the single source of truth for the "denominator" in coverage calculations.
 * 
 * DO NOT create alternative "who should work" logic in UI components.
 * All filtering for operational lists MUST use this function.
 */
export function getPlannedAgentsForDay(
    agents: Representative[], // Changed from WeeklyPlan to direct list
    incidents: Incident[],
    date: ISODate,
    shift: ShiftType,
    allCalendarDays: DayInfo[],
    specialSchedules: SpecialSchedule[] = []
): PlannedAgent[] {
    const planned: PlannedAgent[] = []

    // Ensure only valid active agents are processed
    if (!agents) return []

    for (const representative of agents) {
        const repId = representative.id
        // const representative = representatives.find(r => r.id === repId) // No longer needed

        // 🛡️ DEFENSIVE: Skip if representative doesn't exist or is inactive
        // This handles historical data that may reference soft-deleted representatives
        if (!representative || !representative.isActive) continue

        // ─────────────────────────────
        // 1. BLOQUEO ADMINISTRATIVO
        // ─────────────────────────────
        // Vacation or License removes the agent from the "Planned" count completely.
        const blockingIncident = incidents.find(i => {
            if (i.representativeId !== repId) return false
            if (!['VACACIONES', 'LICENCIA'].includes(i.type)) return false

            const resolved = resolveIncidentDates(i, allCalendarDays, representative)
            return resolved.dates.includes(date)
        })

        if (blockingIncident) continue // ⛔ NO está planificado

        // ─────────────────────────────
        // 1.5. MANUAL OVERRIDES (PRIORITY HIGHEST)
        // ─────────────────────────────
        // Check for manual overrides (e.g. Manual OFF, Manual Shift Change)
        // These take precedence over Effective Schedule (Rules/Base).
        const overrideIncident = incidents.find((i) => {
            // Basic strict check first for optimization, overrides are usually single day
            if (i.representativeId !== repId || i.type !== 'OVERRIDE') return false

            // Allow for multi-day overrides support via resolver
            const resolved = resolveIncidentDates(i, allCalendarDays, representative)
            return resolved.dates.includes(date)
        })

        if (overrideIncident && overrideIncident.assignment) {
            if (overrideIncident.assignment.type === 'NONE') {
                continue // ⛔ Manually overridden to OFF
            }

            if (overrideIncident.assignment.type === 'SINGLE' && overrideIncident.assignment.shift) {
                // Manually assigned to specific shift
                if (overrideIncident.assignment.shift === shift) {
                    planned.push({
                        representativeId: repId,
                        shift,
                        source: 'BASE' // Technically 'OVERRIDE', but mapping to simplified source
                    })
                }
                continue // Handled
            }
        }

        // ─────────────────────────────
        // 2 & 3. CANONICAL SCHEDULE RESOLUTION
        // ─────────────────────────────
        // Use the unified adapter to determine if they work and on what shift.
        const effective = getEffectiveSchedule({
            representative,
            dateStr: date,
            baseSchedule: representative.baseSchedule,
            specialSchedules
        })

        if (effective.type === 'OFF') {
            continue // ⛔ Explicitly OFF
        }

        // If WORKING (BASE, OVERRIDE, MIXTO)
        // Check if the resulting shift matches the requested shift context
        const worksRequestedShift =
            effective.type === 'MIXTO' || // SAFE: MIXTO implies Base is WORKING (handled by adapter)
            (effective.shift === shift) // Specific shift matches

        if (worksRequestedShift) {
            planned.push({
                representativeId: repId,
                shift,
                source: effective.type === 'BASE' ? 'BASE' : 'EFFECTIVE_PERIOD' // Keeping simplified source for now, or could map 'OVERRIDE'
            })
        }
    }

    return planned
}
