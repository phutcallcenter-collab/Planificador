
import { describe, it, expect } from 'vitest'
import { calculateManagerLoad } from './calculateManagerLoad'
import { Manager, ManagerWeeklyPlan } from './types'
import { Incident, Representative } from '@/domain/types'

describe('calculateManagerLoad', () => {
    it('should calculate load correctly for a basic schedule', () => {
        // Manager type (no email)
        const managers: Manager[] = [{ id: 'm1', name: 'Manager 1', role: 'MANAGER' }]
        const representatives: Representative[] = [{
            id: 'm1',
            name: 'Manager 1',
            role: 'MANAGER',
            isActive: true,
            baseSchedule: {
                0: 'OFF', 1: 'DAY', 2: 'DAY', 3: 'DAY', 4: 'DAY', 5: 'DAY', 6: 'DAY'
            },
            email: 'test@test.com'
        }]
        const weekDays = [{ date: '2024-01-01' }] // Monday
        const allCalendarDays = [{ date: '2024-01-01', isHoliday: false, isSpecial: false }]

        // Mock schedule: Explicit days map
        const schedules: Record<string, ManagerWeeklyPlan> = {
            'm1': {
                managerId: 'm1',
                days: {
                    '2024-01-01': { duty: 'DAY' }
                }
            }
        }

        const result = calculateManagerLoad(
            managers,
            schedules,
            [],
            representatives,
            weekDays,
            allCalendarDays
        )

        expect(result).toHaveLength(1)
        expect(result[0].load).toBe(7) // DAY equals 7 hours (9-4)
    })

    it('should handle incidents (VACACIONES)', () => {
        const managers: Manager[] = [{ id: 'm1', name: 'Manager 1', role: 'MANAGER' }]
        const representatives: Representative[] = [{
            id: 'm1',
            name: 'Manager 1',
            role: 'MANAGER',
            isActive: true,
            baseSchedule: {
                0: 'OFF', 1: 'DAY', 2: 'DAY', 3: 'DAY', 4: 'DAY', 5: 'DAY', 6: 'DAY'
            },
            email: 'test@test.com'
        }]
        const weekDays = [{ date: '2024-01-01' }]
        const allCalendarDays = [
            { date: '2024-01-01', isHoliday: false, isSpecial: false },
            { date: '2024-01-02', isHoliday: false, isSpecial: false },
            { date: '2024-01-03', isHoliday: false, isSpecial: false },
        ]

        const schedules: Record<string, ManagerWeeklyPlan> = {
            'm1': {
                managerId: 'm1',
                days: {
                    '2024-01-01': { duty: 'DAY' }
                }
            }
        }

        const incidents: Incident[] = [{
            id: 'inc1',
            type: 'VACACIONES',
            representativeId: 'm1',
            date: '2024-01-01',
            startDate: '2024-01-01',
            source: 'BASE',
            reason: 'Vacation',
            duration: 1
        }]

        const result = calculateManagerLoad(
            managers,
            schedules,
            incidents,
            representatives,
            weekDays,
            allCalendarDays
        )

        expect(result[0].load).toBe(0) // Vacation indicates 0 hours
    })
})
