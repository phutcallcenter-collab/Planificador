'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useWeekNavigator } from '@/hooks/useWeekNavigator'
import { format, parseISO, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { ManagerDuty } from '@/domain/management/types'
import { Plus, Trash2, User } from 'lucide-react'
import { ManagerPlannerCell } from '@/ui/management/ManagerPlannerCell'
import { resolveEffectiveManagerDay } from '@/application/ui-adapters/resolveEffectiveManagerDay'
import { mapManagerDayToCell } from '@/application/ui-adapters/mapManagerDayToCell'
import { EffectiveManagerDay } from '@/application/ui-adapters/types'
import { calculateManagerLoad } from '@/domain/management/calculateManagerLoad'
import { getDutyHours } from '@/domain/management/workload'

// 🛡️ INSTITUTIONAL TRUTH: OPERATIONAL LOAD MODEL (HOURLY)
// Carga Operativa = horas reales (con ajuste de fin de semana)

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ManagerScheduleManagementProps {
    embedded?: boolean
}

// Helper for Sortable Row
function SortableRow({ children, id }: { children: React.ReactNode, id: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const,
        zIndex: isDragging ? 999 : 'auto',
    }

    return (
        <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </tr>
    )
}

export function ManagerScheduleManagement({ embedded = false }: ManagerScheduleManagementProps) {
    const {
        managers,
        managementSchedules,
        incidents,
        allCalendarDaysForRelevantMonths,
        representatives,
        addManager,
        removeManager,
        setManagerDuty,
        clearManagerDuty,
        planningAnchorDate,
        setPlanningAnchorDate,
        copyManagerWeek,
        reorderManagers,
    } = useAppStore(s => ({
        managers: s.managers,
        managementSchedules: s.managementSchedules,
        incidents: s.incidents,
        allCalendarDaysForRelevantMonths: s.allCalendarDaysForRelevantMonths,
        representatives: s.representatives,
        addManager: s.addManager,
        removeManager: s.removeManager,
        setManagerDuty: s.setManagerDuty,
        clearManagerDuty: s.clearManagerDuty,
        planningAnchorDate: s.planningAnchorDate,
        setPlanningAnchorDate: s.setPlanningAnchorDate,
        copyManagerWeek: s.copyManagerWeek,
        reorderManagers: s.reorderManagers
    }))

    const { weekDays, label: weekLabel, handlePrevWeek, handleNextWeek } = useWeekNavigator(
        planningAnchorDate,
        setPlanningAnchorDate
    )

    const [newManagerName, setNewManagerName] = useState('')

    // 🛡️ UX RULE: FORCE CURRENT WEEK ON MOUNT
    // This resets the view to "Today" every time the user enters this screen,
    // preventing confusion from previous sessions.
    React.useEffect(() => {
        setPlanningAnchorDate(format(new Date(), 'yyyy-MM-dd'))
    }, []) // Empty dependency array = run once on mount

    const handleCreateManager = () => {
        if (!newManagerName.trim()) return
        addManager({ name: newManagerName.trim() })
        setNewManagerName('')
    }

    const handleDutyChange = (managerId: string, date: string, value: string) => {
        if (value === 'EMPTY') {
            const note = window.prompt('Limpiar día y añadir comentario (opcional):', '')
            // allow empty string to clear without note
            if (note === null) return

            setManagerDuty(managerId, date, null, note || undefined)
        } else if (value === 'OFF') {
            setManagerDuty(managerId, date, 'OFF', undefined)
        } else {
            // DAY, NIGHT, INTER, MONITORING
            setManagerDuty(managerId, date, value as ManagerDuty)
        }
    }

    const handleCopyWeek = () => {
        const confirm = window.confirm(
            `¿Estás seguro de copiar la planificación de esta semana (${weekLabel}) a la siguiente? Esto sobrescribirá los datos existentes de la próxima semana.`
        )
        if (!confirm) return

        const currentWeekDates = weekDays.map(d => d.date)
        const nextWeekDates = currentWeekDates.map(dateStr => {
            const date = parseISO(dateStr)
            return format(addDays(date, 7), 'yyyy-MM-dd')
        })

        copyManagerWeek(currentWeekDates, nextWeekDates)

        // Optional: Navigate to next week to see result
        handleNextWeek()
    }

    // Check if we are in the current week to show "Back to Today" button
    const isCurrentWeek = weekDays.some(d => d.date === format(new Date(), 'yyyy-MM-dd'))

    // 🛡️ FAIRNESS ENGINE: Calculate loads BEFORE rendering to enable team-wide analysis
    const managerLoads = React.useMemo(() => {
        return calculateManagerLoad(
            managers,
            managementSchedules,
            incidents,
            representatives,
            weekDays,
            allCalendarDaysForRelevantMonths
        )
    }, [managers, managementSchedules, weekDays, incidents, representatives, allCalendarDaysForRelevantMonths])

    // 🛡️ STATISTICAL ANALYSIS (Internal Sensor)
    const fairnessAnalysis = React.useMemo(() => {
        if (managerLoads.length < 2) return { status: 'OK', message: null, outliers: [], detailedOffenders: [] }

        const loads = managerLoads.map(m => m.load)
        const avg = loads.reduce((a, b) => a + b, 0) / loads.length

        // Variance & StdDev
        const squareDiffs = loads.map(value => {
            const diff = value - avg;
            return diff * diff;
        });
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
        const stdDev = Math.sqrt(avgSquareDiff);

        const maxLoad = Math.max(...loads)
        const minLoad = Math.min(...loads)

        // Rule 1: Hard Outlier (> Avg + 1.5 StdDev)
        // Threshold adjusted for Hours scale (e.g., > 50h is definitely heavy)
        const loadOutliers = managerLoads.filter(m => m.load > avg + (1.5 * stdDev) && m.load > 45)

        // Rule 2: Structural Punishment (>=3 nights && >=1 weekend night)
        const structuralOutliers = managerLoads.filter(m => m.nightCount >= 3 && m.weekendNightCount >= 1)

        const allProblems = [...new Set([...loadOutliers, ...structuralOutliers])]

        if (allProblems.length > 0) {
            const isCritical = loadOutliers.length > 0 && structuralOutliers.length > 0

            return {
                status: isCritical ? 'CRITICAL' : 'DESBALANCED',
                message: 'Structural Variance Detected',
                outliers: allProblems.map(m => m.name),
                detailedOffenders: allProblems.map(m => ({
                    managerId: m.id,
                    load: m.load,
                    deviation: m.load - avg,
                    signals: {
                        nightConcentration: m.nightCount >= 3,
                        weekendNights: m.weekendNightCount,
                        relativeOverload: m.load > avg + (1.5 * stdDev)
                    }
                })),
                metrics: { avg, stdDev, maxLoad, minLoad }
            }
        }

        return { status: 'OK', message: null, outliers: [], detailedOffenders: [] }
    }, [managerLoads])

    // 🫥 SILENT LOGGER (Persistent Memory)
    React.useEffect(() => {
        if (fairnessAnalysis.status !== 'OK' && fairnessAnalysis.metrics) {
            const logEntry = {
                event: 'STRUCTURAL_LOAD_VARIANCE',
                week: `Week-${planningAnchorDate}`,
                status: fairnessAnalysis.status,
                avgLoad: Number(fairnessAnalysis.metrics.avg.toFixed(2)),
                stdDeviation: Number(fairnessAnalysis.metrics.stdDev.toFixed(2)),
                maxLoad: Number(fairnessAnalysis.metrics.maxLoad.toFixed(2)),
                minLoad: Number(fairnessAnalysis.metrics.minLoad.toFixed(2)),
                flaggedManagers: fairnessAnalysis.detailedOffenders,
                timestamp: new Date().toISOString()
            }

            // 1. Console Trace (Dev only)
            console.groupCollapsed(`🫥 Structural Variance Detected: ${fairnessAnalysis.status}`)
            console.table(fairnessAnalysis.detailedOffenders)
            console.log('Full Log:', logEntry)
            console.groupEnd()

            // 2. Persistent Storage (Black Box)
            try {
                const history = JSON.parse(localStorage.getItem('structural_logs') || '[]')
                history.push(logEntry)
                // Keep last 50 logs only
                if (history.length > 50) history.shift()
                localStorage.setItem('structural_logs', JSON.stringify(history))
            } catch (e) {
                // Silent fail
            }
        }
    }, [fairnessAnalysis, planningAnchorDate])

    // 🔍 FIND MOST LOADED MANAGER (Single Indicator)
    const mostLoadedManagerId = React.useMemo(() => {
        if (managerLoads.length < 2) return null

        const maxLoad = Math.max(...managerLoads.map(m => m.load))
        if (maxLoad === 0) return null

        const contenders = managerLoads.filter(m => m.load === maxLoad)
        // Only mark if unique (avoid ties to prevent noise)
        return contenders.length === 1 ? contenders[0].id : null
    }, [managerLoads])

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = managerLoads.findIndex((m) => m.id === active.id);
            const newIndex = managerLoads.findIndex((m) => m.id === over.id);

            // Create new order
            const newOrder = arrayMove(managerLoads.map(m => m.id), oldIndex, newIndex);
            reorderManagers(newOrder);
        }
    };

    return (
        <div style={embedded ? { marginTop: 'var(--space-md)' } : { background: 'var(--bg-app)', minHeight: '100vh', padding: 'var(--space-lg)' }}>
            <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {!embedded ? (
                    <>
                        <div>
                            <h3 style={{ margin: '0 0 var(--space-xs) 0', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-main)' }}>
                                Horarios de Gerencia
                            </h3>
                            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                                Planificación semanal con soporte para incidencias.
                            </p>
                        </div>

                        {/* Time Sovereign */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>

                            {!isCurrentWeek && (
                                <button
                                    onClick={() => setPlanningAnchorDate(format(new Date(), 'yyyy-MM-dd'))}
                                    style={{
                                        padding: '6px 12px',
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--font-size-sm)',
                                        fontWeight: 'var(--font-weight-semibold)',
                                        color: 'var(--text-main)',
                                        cursor: 'pointer',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                >
                                    Hoy
                                </button>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', background: 'var(--bg-surface)', padding: '6px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                                <button onClick={handlePrevWeek} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 10px', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }}>&lt;</button>
                                <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', width: '220px', textAlign: 'center', color: 'var(--text-main)' }}>{weekLabel}</span>
                                <button onClick={handleNextWeek} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 10px', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }}>&gt;</button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Spacer for embedded mode to push button to right if needed, or just standard flex behavior */
                    <div />
                )}

                <div style={{ marginLeft: '12px' }}>
                    <button
                        onClick={handleCopyWeek}
                        style={{
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            padding: '4px 12px',
                            fontSize: 'var(--font-size-sm)',
                            cursor: 'pointer',
                            color: 'var(--text-main)',
                        }}
                        title="Copiar planificación a la próxima semana"
                    >
                        Copiar ➝
                    </button>
                </div>
            </div>


            {/* Main Grid */}
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-card)', overflow: 'hidden', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-md)' }}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-base)' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                                <th style={{ width: '30px' }}></th> {/* Grip handle column */}
                                <th style={{ textAlign: 'left', padding: 'var(--space-md)', color: 'var(--text-muted)', fontWeight: 'var(--font-weight-semibold)', width: '200px' }}>Supervisor</th>
                                {weekDays.map(day => (
                                    <th key={day.date} style={{ textAlign: 'center', padding: 'var(--space-md) var(--space-sm)', color: 'var(--text-muted)', fontWeight: 'var(--font-weight-semibold)' }}>
                                        <div>{format(parseISO(day.date), 'EEE', { locale: es })}</div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-faint)', fontWeight: 'var(--font-weight-normal)' }}>{format(parseISO(day.date), 'd')}</div>
                                    </th>
                                ))}
                                <th style={{ width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            <SortableContext
                                items={managerLoads.map(m => m.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {managerLoads
                                    .map((computedManager) => {
                                        // Find manager and plan again just for context if needed, or use computad manager data
                                        const manager = managers.find(m => m.id === computedManager.id)!
                                        // Safety check
                                        if (!manager) return null;

                                        const representative = representatives.find(r => r.id === manager.id)
                                        const weeklyPlan = managementSchedules[manager.id] || null
                                        const weeklyLoad = computedManager.load
                                        const isMostLoaded = mostLoadedManagerId === manager.id

                                        // Load Color Logic (Hourly Scale)
                                        // 🟢 <= 38: Normal
                                        // 🟡 39-44: Exigente
                                        // 🟠 45-50: Pesado
                                        // 🔴 > 50 : Estructuralmente cargado
                                        let loadColor = '#22c55e' // Green
                                        if (weeklyLoad > 38 && weeklyLoad <= 44) loadColor = '#eab308' // Yellow
                                        if (weeklyLoad > 44 && weeklyLoad <= 50) loadColor = '#f97316' // Orange
                                        if (weeklyLoad > 50) loadColor = '#ef4444' // Red

                                        // Progress (capped visual scale at 55h)
                                        const progress = Math.min((weeklyLoad / 55) * 100, 100)

                                        return (
                                            <SortableRow key={manager.id} id={manager.id}>
                                                <td style={{ textAlign: 'center', color: 'var(--text-muted)', cursor: 'grab', touchAction: 'none' }}>
                                                    ⋮ ::
                                                </td>
                                                <td style={{ padding: 'var(--space-sm) var(--space-md)', color: 'var(--text-main)', fontWeight: 'var(--font-weight-medium)', borderRight: '1px solid var(--border-subtle)' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '24px', height: '24px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                                                <User size={14} />
                                                            </div>
                                                            {manager.name}
                                                            {isMostLoaded && (
                                                                <span
                                                                    title="Mayor carga horaria esta semana"
                                                                    style={{
                                                                        fontSize: '11px',
                                                                        color: '#9ca3af', // Gray-400 (polite)
                                                                        marginLeft: '2px',
                                                                        cursor: 'help'
                                                                    }}
                                                                >
                                                                    ●
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Workload Meter */}
                                                        <div
                                                            title={`Carga horaria semanal: ${weeklyLoad.toFixed(1)} h\n\nIncluye duración real de turnos.\nNo mide desempeño ni productividad.\nUsado solo para balance de planificación.`}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                fontSize: '11px',
                                                                color: '#6b7280',
                                                                paddingLeft: '32px'
                                                            }}
                                                        >
                                                            <div style={{ width: '60px', height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                                                                <div style={{ width: `${progress}%`, height: '100%', background: loadColor, transition: 'width 0.3s' }} />
                                                            </div>
                                                            <span style={{ fontWeight: 500 }}>{Number(weeklyLoad.toFixed(1))}h</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                {weekDays.map(day => {
                                                    const effectiveDay = resolveEffectiveManagerDay(
                                                        weeklyPlan,
                                                        incidents,
                                                        day.date,
                                                        allCalendarDaysForRelevantMonths,
                                                        representative
                                                    )

                                                    const cellState = mapManagerDayToCell(effectiveDay, manager.name)

                                                    // Determine current value for selector
                                                    // We need to re-derive this because we are inside render now
                                                    let currentValue = 'EMPTY'
                                                    if (effectiveDay.kind === 'DUTY') currentValue = effectiveDay.duty
                                                    else if (effectiveDay.kind === 'OFF') currentValue = 'OFF'
                                                    else if (effectiveDay.kind === 'EMPTY') currentValue = 'EMPTY'

                                                    const isEditable = cellState.isEditable && effectiveDay.kind !== 'VACATION' && effectiveDay.kind !== 'LICENSE'

                                                    return (
                                                        <td key={day.date} style={{ padding: '6px' }}>
                                                            <ManagerPlannerCell
                                                                state={cellState.state}
                                                                label={cellState.label}
                                                                tooltip={cellState.tooltip}
                                                                currentValue={currentValue}
                                                                onChange={isEditable ? (val) => handleDutyChange(manager.id, day.date, val) : undefined}
                                                            />
                                                        </td>
                                                    )
                                                })}
                                                <td style={{ padding: '0 8px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => removeManager(manager.id)}
                                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#fee2e2' }}
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} color="#ef4444" />
                                                    </button>
                                                </td>
                                            </SortableRow>
                                        )
                                    })}
                            </SortableContext>
                            {managers.length === 0 && (
                                <tr>
                                    <td colSpan={10} style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No hay supervisores registrados. Añade uno abajo.
                                    </td>
                                </tr>
                            )}

                            {/* Add Row */}
                            <tr style={{ background: 'var(--bg-subtle)' }}>
                                <td style={{ padding: 'var(--space-md)' }} colSpan={2}>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                        <input
                                            placeholder="Nuevo Supervisor..."
                                            value={newManagerName}
                                            onChange={(e) => setNewManagerName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateManager()}
                                            style={{
                                                border: '1px solid var(--border-subtle)',
                                                borderRadius: 'var(--radius-md)',
                                                padding: 'var(--space-sm)',
                                                fontSize: 'var(--font-size-base)',
                                                flex: 1,
                                                outline: 'none',
                                                background: 'var(--bg-surface)',
                                                color: 'var(--text-main)'
                                            }}
                                        />
                                        <button
                                            onClick={handleCreateManager}
                                            disabled={!newManagerName.trim()}
                                            style={{
                                                background: 'var(--success)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 'var(--radius-md)',
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                opacity: !newManagerName.trim() ? 0.5 : 1
                                            }}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </td>
                                <td colSpan={8}></td>
                            </tr>
                        </tbody>
                    </table>
                </DndContext>
            </div>
        </div>
    )
}
