// components/prediction/WeeklyPredictionCard.stories.tsx

/**
 * Storybook stories for WeeklyPredictionCard
 * 
 * Shows different states: ALTA, MEDIA, BAJA confidence
 * and different trend scenarios.
 */

import React from 'react'
import { WeeklyPredictionCard } from './WeeklyPredictionCard'
import { WeeklyPrediction } from '@/domain/call-center-analysis/prediction/v3/types'
import './WeeklyPredictionCard.css'

export default {
    title: 'Prediction/WeeklyPredictionCard',
    component: WeeklyPredictionCard,
}

// ============================================
// STORY 1: High Confidence, Stable
// ============================================

const stablePrediction: WeeklyPrediction = {
    horizon: {
        start: '2026-02-03',
        end: '2026-02-09',
        days: 7
    },
    baseline: {
        avgDailyVolume: 180,
        source: 'v2_model',
        confidence: 'ALTA',
        historicalDays: 28
    },
    dailyOutlook: [
        { date: '2026-02-03', dayOfWeek: 'Lunes', relativeChange: 0, severity: 'NORMAL', predictedVolume: 180 },
        { date: '2026-02-04', dayOfWeek: 'Martes', relativeChange: 0, severity: 'NORMAL', predictedVolume: 180 },
        { date: '2026-02-05', dayOfWeek: 'Miércoles', relativeChange: 0, severity: 'NORMAL', predictedVolume: 180 },
        { date: '2026-02-06', dayOfWeek: 'Jueves', relativeChange: 0, severity: 'NORMAL', predictedVolume: 180 },
        { date: '2026-02-07', dayOfWeek: 'Viernes', relativeChange: 0, severity: 'NORMAL', predictedVolume: 180 },
        { date: '2026-02-08', dayOfWeek: 'Sábado', relativeChange: 0, severity: 'NORMAL', predictedVolume: 180 },
        { date: '2026-02-09', dayOfWeek: 'Domingo', relativeChange: 0, severity: 'NORMAL', predictedVolume: 180 }
    ],
    summary: {
        peakDay: '2026-02-03',
        peakChange: 0,
        trendDirection: 'STABLE',
        confidence: 'ALTA',
        assumptions: [
            'Patrón estable detectado',
            'Baseline derivado de últimos 28 días',
            'Asume continuidad operativa'
        ],
        warnings: []
    },
    meta: {
        generatedAt: '2026-02-01T14:30:00Z',
        modelVersion: 'v3',
        baseModelVersion: 'v2',
        trendDetected: false
    }
}

export const HighConfidenceStable = () => (
    <WeeklyPredictionCard prediction={stablePrediction} />
)

// ============================================
// STORY 2: Medium Confidence, Upward Trend
// ============================================

const upwardTrendPrediction: WeeklyPrediction = {
    horizon: {
        start: '2026-02-10',
        end: '2026-02-16',
        days: 7
    },
    baseline: {
        avgDailyVolume: 180,
        source: 'v2_model',
        confidence: 'MEDIA',
        historicalDays: 14
    },
    dailyOutlook: [
        { date: '2026-02-10', dayOfWeek: 'Lunes', relativeChange: 0.00, severity: 'NORMAL', predictedVolume: 180 },
        { date: '2026-02-11', dayOfWeek: 'Martes', relativeChange: 0.02, severity: 'NORMAL', predictedVolume: 184 },
        { date: '2026-02-12', dayOfWeek: 'Miércoles', relativeChange: 0.04, severity: 'NORMAL', predictedVolume: 187 },
        { date: '2026-02-13', dayOfWeek: 'Jueves', relativeChange: 0.06, severity: 'ELEVATED', predictedVolume: 191 },
        { date: '2026-02-14', dayOfWeek: 'Viernes', relativeChange: 0.12, severity: 'CRITICAL', predictedVolume: 202 },
        { date: '2026-02-15', dayOfWeek: 'Sábado', relativeChange: 0.08, severity: 'ELEVATED', predictedVolume: 194 },
        { date: '2026-02-16', dayOfWeek: 'Domingo', relativeChange: 0.03, severity: 'NORMAL', predictedVolume: 185 }
    ],
    summary: {
        peakDay: '2026-02-14',
        peakChange: 0.12,
        trendDirection: 'UP',
        confidence: 'MEDIA',
        assumptions: [
            'Tendencia UP detectada (8.5%)',
            'Patrón histórico: viernes concentra picos',
            'Baseline derivado de últimos 14 días'
        ],
        warnings: [
            'Extrapolación lineal: tendencia puede no continuar',
            'No considera eventos externos'
        ]
    },
    meta: {
        generatedAt: '2026-02-08T14:30:00Z',
        modelVersion: 'v3',
        baseModelVersion: 'v2',
        trendDetected: true,
        trendMagnitude: 0.085
    }
}

export const MediumConfidenceUpward = () => (
    <WeeklyPredictionCard prediction={upwardTrendPrediction} />
)

// ============================================
// STORY 3: Low Confidence, Downward Trend
// ============================================

const lowConfidencePrediction: WeeklyPrediction = {
    horizon: {
        start: '2026-02-17',
        end: '2026-02-23',
        days: 7
    },
    baseline: {
        avgDailyVolume: 200,
        source: 'v2_model',
        confidence: 'BAJA',
        historicalDays: 10
    },
    dailyOutlook: [
        { date: '2026-02-17', dayOfWeek: 'Lunes', relativeChange: 0.00, severity: 'NORMAL' },
        { date: '2026-02-18', dayOfWeek: 'Martes', relativeChange: -0.01, severity: 'NORMAL' },
        { date: '2026-02-19', dayOfWeek: 'Miércoles', relativeChange: -0.02, severity: 'NORMAL' },
        { date: '2026-02-20', dayOfWeek: 'Jueves', relativeChange: -0.03, severity: 'NORMAL' },
        { date: '2026-02-21', dayOfWeek: 'Viernes', relativeChange: -0.04, severity: 'NORMAL' },
        { date: '2026-02-22', dayOfWeek: 'Sábado', relativeChange: -0.05, severity: 'NORMAL' },
        { date: '2026-02-23', dayOfWeek: 'Domingo', relativeChange: -0.06, severity: 'ELEVATED' }
    ],
    summary: {
        peakDay: '2026-02-23',
        peakChange: -0.06,
        trendDirection: 'DOWN',
        confidence: 'BAJA',
        assumptions: [
            'Tendencia DOWN detectada (-6%)',
            'Histórico limitado (10 días)',
            'Baseline derivado de últimos 10 días'
        ],
        warnings: [
            'Confianza baja: usar solo como referencia orientativa',
            'Extrapolación lineal: tendencia puede no continuar',
            'No considera eventos externos'
        ]
    },
    meta: {
        generatedAt: '2026-02-15T14:30:00Z',
        modelVersion: 'v3',
        baseModelVersion: 'v2',
        trendDetected: true,
        trendMagnitude: -0.06
    }
}

export const LowConfidenceDownward = () => (
    <WeeklyPredictionCard prediction={lowConfidencePrediction} />
)
