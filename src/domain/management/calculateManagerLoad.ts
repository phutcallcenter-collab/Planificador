
import { Manager, ManagerWeeklyPlan } from './types'
import { Incident, DayInfo, Representative } from '@/domain/types'
import { resolveEffectiveManagerDay } from '@/application/ui-adapters/resolveEffectiveManagerDay'
import { getDutyHours } from './workload'
import { parseISO } from 'date-fns'

interface ManagerLoadResult {
    id: string
    name: string
    load: number
    nightCount: number
    weekendNightCount: number
}

export function calculateManagerLoad(
    managers: Manager[],
    managementSchedules: Record<string, ManagerWeeklyPlan>,
    incidents: Incident[],
    representatives: Representative[],
    weekDays: Array<{ date: string }>,
    allCalendarDays: DayInfo[]
): ManagerLoadResult[] {
    return managers
        .filter(manager => {
            const rep = representatives.find(r => r.id === manager.id)
            return rep ? rep.isActive !== false : true
        })
        .map(manager => {
            const representative = representatives.find(r => r.id === manager.id)
            const weeklyPlan = managementSchedules[manager.id] || null

            let totalHours = 0
            let nightCount = 0
            let weekendNightCount = 0

            weekDays.forEach(day => {
                const effectiveDay = resolveEffectiveManagerDay(
                    weeklyPlan,
                    incidents,
                    day.date,
                    allCalendarDays,
                    representative
                )

                let duty: string | null = null
                if (effectiveDay.kind === 'DUTY') duty = effectiveDay.duty

                if (!duty) return

                const dayOfWeek = parseISO(day.date).getDay()
                const { hours } = getDutyHours(duty, dayOfWeek)

                totalHours += hours

                if (duty === 'NIGHT') {
                    nightCount++
                    if (dayOfWeek === 5 || dayOfWeek === 6) weekendNightCount++
                }
            })

            return {
                id: manager.id,
                name: manager.name,
                load: totalHours,
                nightCount,
                weekendNightCount
            }
        })
}
