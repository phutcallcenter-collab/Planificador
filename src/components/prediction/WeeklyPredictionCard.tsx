// components/prediction/WeeklyPredictionCard.tsx

import React from 'react'
import { WeeklyPrediction } from '@/domain/call-center-analysis/prediction/v3/types'

interface WeeklyPredictionCardProps {
    prediction: WeeklyPrediction
}

/**
 * Weekly Prediction Card
 * 
 * Displays 7-day prediction for operational planning.
 * Visual design prevents confusion with real data.
 * 
 * Philosophy: Make it impossible to misinterpret.
 */
export function WeeklyPredictionCard({ prediction }: WeeklyPredictionCardProps) {
    const { horizon, baseline, dailyOutlook, summary } = prediction

    return (
        <div className="weekly-prediction-card">
            {/* Header */}
            <div className="prediction-header">
                <span className="prediction-label">
                    🔮 PREDICCIÓN SEMANAL
                </span>
                <ConfidenceBadge level={baseline.confidence} />
            </div>

            {/* Low Confidence Warning (persistent) */}
            {baseline.confidence === 'BAJA' && (
                <div className="prediction-warning-persistent">
                    ⚠️ Predicción orientativa. No usar para decisiones finas.
                </div>
            )}

            {/* Context */}
            <div className="prediction-context">
                <p>Baseline: ~{baseline.avgDailyVolume} llamadas/día <span className="context-note">(promedio diario observado)</span></p>
                <p>Basado en: últimos {baseline.historicalDays} días</p>
                <p>Horizonte: {formatDate(horizon.start)} - {formatDate(horizon.end)}</p>
            </div>

            {/* Scope Clarification */}
            <div className="prediction-scope-note">
                ℹ️ Esta predicción describe volumen esperado, no capacidad ni carga.
            </div>

            {/* Daily Outlook */}
            <div className="daily-outlook">
                {dailyOutlook.map((day) => (
                    <DayRow
                        key={day.date}
                        day={day}
                        isPeak={day.date === summary.peakDay}
                    />
                ))}
            </div>

            {/* Summary */}
            <div className="prediction-summary">
                {/* Only show peak day if there's actual variation (Fix 2) */}
                {Math.abs(summary.peakChange) > 0.01 ? (
                    <p className="summary-peak">
                        🎯 Día crítico: {formatDayOfWeek(summary.peakDay)} ({formatPercent(summary.peakChange)})
                    </p>
                ) : (
                    <p className="summary-peak">
                        🎯 Sin diferencias esperadas entre días
                    </p>
                )}
                <p className="summary-trend">
                    📈 Tendencia: {summary.trendDirection}
                    {prediction.meta.trendMagnitude && ` (${formatPercent(prediction.meta.trendMagnitude)})`}
                </p>
                <p className="summary-variability">
                    📊 Variabilidad: {summary.variability}
                </p>

                {/* Assumptions (always visible) */}
                <div className="assumptions">
                    <p className="assumptions-label">⚠️ Supuestos:</p>
                    <ul>
                        {summary.assumptions.map((assumption, i) => (
                            <li key={i}>{assumption}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface ConfidenceBadgeProps {
    level: string
}

function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
    const config = {
        ALTA: { label: 'ALTA', color: 'blue', tooltip: 'Alta confianza. Basado en 28+ días de histórico estable.' },
        MEDIA: { label: 'MEDIA', color: 'amber', tooltip: 'Confianza media. Usar como referencia orientativa.' },
        BAJA: { label: 'BAJA', color: 'orange', tooltip: 'Confianza baja. Solo para detección de tendencias.' },
        INVALIDA: { label: 'INVALIDA', color: 'gray', tooltip: 'Predicción no disponible.' }
    }

    const { label, color, tooltip } = config[level as keyof typeof config] || config.INVALIDA

    return (
        <span
            className={`confidence-badge confidence-${color}`}
            title={tooltip}
        >
            {label}
        </span>
    )
}

interface DayRowProps {
    day: {
        dayOfWeek: string
        relativeChange: number
        severity: string
        predictedVolume?: number
        note?: string
    }
    isPeak: boolean
}

function DayRow({ day, isPeak }: DayRowProps) {
    const severityIcon = {
        NORMAL: '⚪',
        ELEVATED: '🟡',
        CRITICAL: '🔴'
    }[day.severity] || '⚪'

    const changeSign = day.relativeChange >= 0 ? '+' : ''
    const changePercent = `${changeSign}${(day.relativeChange * 100).toFixed(0)}%`

    return (
        <div className={`day-row ${isPeak ? 'day-row-peak' : ''}`}>
            <span className="day-name">{day.dayOfWeek}</span>
            <span className="day-change">{changePercent}</span>
            <span className="day-severity">
                {severityIcon} {day.severity}
            </span>
            {day.predictedVolume && (
                <span className="day-volume">~{day.predictedVolume}</span>
            )}
            {/* Only show peak marker if there's actual variation (Fix 2) */}
            {isPeak && Math.abs(day.relativeChange) > 0.01 && <span className="peak-marker">← Pico</span>}
        </div>
    )
}

// ============================================
// HELPERS
// ============================================

function formatDate(isoDate: string): string {
    const date = new Date(isoDate)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function formatDayOfWeek(isoDate: string): string {
    const date = new Date(isoDate)
    return date.toLocaleDateString('es-ES', { weekday: 'long' })
}

function formatPercent(value: number): string {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${(value * 100).toFixed(1)}%`
}
