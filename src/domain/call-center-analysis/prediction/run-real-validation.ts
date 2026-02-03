/**
 * Real Data Validation Runner
 * 
 * Script ejecutable para correr validación con datos reales.
 * Usa datos de ejemplo mínimos para demostración.
 * 
 * Para usar con datos reales del sistema:
 * 1. Importar ActualOperationalLoadBuilder
 * 2. Cargar CSVs reales
 * 3. Ejecutar runRealDataValidation
 */

import { runRealDataValidation } from './test-real-data'
import { ActualOperationalLoad } from '../adapter/OperationalCorrelationAdapter'

// ============================================
// DATASET MÍNIMO REAL (14 días históricos + 3 días validación)
// ============================================

// Histórico: 14 días (2026-01-01 a 2026-01-14)
const historicalLoads: ActualOperationalLoad[] = [
    // Semana 1
    { date: '2026-01-01', shift: 'DAY', receivedCalls: 120, answeredCalls: 115, abandonedCalls: 5, transactions: 45 },
    { date: '2026-01-01', shift: 'NIGHT', receivedCalls: 80, answeredCalls: 75, abandonedCalls: 5, transactions: 30 },
    { date: '2026-01-02', shift: 'DAY', receivedCalls: 125, answeredCalls: 120, abandonedCalls: 5, transactions: 48 },
    { date: '2026-01-02', shift: 'NIGHT', receivedCalls: 85, answeredCalls: 80, abandonedCalls: 5, transactions: 32 },
    { date: '2026-01-03', shift: 'DAY', receivedCalls: 130, answeredCalls: 125, abandonedCalls: 5, transactions: 50 },
    { date: '2026-01-03', shift: 'NIGHT', receivedCalls: 90, answeredCalls: 85, abandonedCalls: 5, transactions: 35 },
    { date: '2026-01-04', shift: 'DAY', receivedCalls: 135, answeredCalls: 130, abandonedCalls: 5, transactions: 52 },
    { date: '2026-01-04', shift: 'NIGHT', receivedCalls: 95, answeredCalls: 90, abandonedCalls: 5, transactions: 38 },
    { date: '2026-01-05', shift: 'DAY', receivedCalls: 140, answeredCalls: 135, abandonedCalls: 5, transactions: 55 },
    { date: '2026-01-05', shift: 'NIGHT', receivedCalls: 100, answeredCalls: 95, abandonedCalls: 5, transactions: 40 },
    { date: '2026-01-06', shift: 'DAY', receivedCalls: 145, answeredCalls: 140, abandonedCalls: 5, transactions: 58 },
    { date: '2026-01-06', shift: 'NIGHT', receivedCalls: 105, answeredCalls: 100, abandonedCalls: 5, transactions: 42 },
    { date: '2026-01-07', shift: 'DAY', receivedCalls: 150, answeredCalls: 145, abandonedCalls: 5, transactions: 60 },
    { date: '2026-01-07', shift: 'NIGHT', receivedCalls: 110, answeredCalls: 105, abandonedCalls: 5, transactions: 45 },

    // Semana 2
    { date: '2026-01-08', shift: 'DAY', receivedCalls: 155, answeredCalls: 150, abandonedCalls: 5, transactions: 62 },
    { date: '2026-01-08', shift: 'NIGHT', receivedCalls: 115, answeredCalls: 110, abandonedCalls: 5, transactions: 48 },
    { date: '2026-01-09', shift: 'DAY', receivedCalls: 160, answeredCalls: 155, abandonedCalls: 5, transactions: 65 },
    { date: '2026-01-09', shift: 'NIGHT', receivedCalls: 120, answeredCalls: 115, abandonedCalls: 5, transactions: 50 },
    { date: '2026-01-10', shift: 'DAY', receivedCalls: 165, answeredCalls: 160, abandonedCalls: 5, transactions: 68 },
    { date: '2026-01-10', shift: 'NIGHT', receivedCalls: 125, answeredCalls: 120, abandonedCalls: 5, transactions: 52 },
    { date: '2026-01-11', shift: 'DAY', receivedCalls: 170, answeredCalls: 165, abandonedCalls: 5, transactions: 70 },
    { date: '2026-01-11', shift: 'NIGHT', receivedCalls: 130, answeredCalls: 125, abandonedCalls: 5, transactions: 55 },
    { date: '2026-01-12', shift: 'DAY', receivedCalls: 175, answeredCalls: 170, abandonedCalls: 5, transactions: 72 },
    { date: '2026-01-12', shift: 'NIGHT', receivedCalls: 135, answeredCalls: 130, abandonedCalls: 5, transactions: 58 },
    { date: '2026-01-13', shift: 'DAY', receivedCalls: 180, answeredCalls: 175, abandonedCalls: 5, transactions: 75 },
    { date: '2026-01-13', shift: 'NIGHT', receivedCalls: 140, answeredCalls: 135, abandonedCalls: 5, transactions: 60 },
    { date: '2026-01-14', shift: 'DAY', receivedCalls: 185, answeredCalls: 180, abandonedCalls: 5, transactions: 78 },
    { date: '2026-01-14', shift: 'NIGHT', receivedCalls: 145, answeredCalls: 140, abandonedCalls: 5, transactions: 62 },
]

// Futuro: 3 días para validar (2026-01-15 a 2026-01-17)
const futureLoads: ActualOperationalLoad[] = [
    { date: '2026-01-15', shift: 'DAY', receivedCalls: 190, answeredCalls: 185, abandonedCalls: 5, transactions: 80 },
    { date: '2026-01-15', shift: 'NIGHT', receivedCalls: 150, answeredCalls: 145, abandonedCalls: 5, transactions: 65 },
    { date: '2026-01-16', shift: 'DAY', receivedCalls: 195, answeredCalls: 190, abandonedCalls: 5, transactions: 82 },
    { date: '2026-01-16', shift: 'NIGHT', receivedCalls: 155, answeredCalls: 150, abandonedCalls: 5, transactions: 68 },
    { date: '2026-01-17', shift: 'DAY', receivedCalls: 200, answeredCalls: 195, abandonedCalls: 5, transactions: 85 },
    { date: '2026-01-17', shift: 'NIGHT', receivedCalls: 160, answeredCalls: 155, abandonedCalls: 5, transactions: 70 },
]

// Capacidad planificada (asumida: 10 DAY, 6 NIGHT)
const plannedAgents = [
    { date: '2026-01-15', shift: 'DAY' as const, headcount: 10 },
    { date: '2026-01-15', shift: 'NIGHT' as const, headcount: 6 },
    { date: '2026-01-16', shift: 'DAY' as const, headcount: 10 },
    { date: '2026-01-16', shift: 'NIGHT' as const, headcount: 6 },
    { date: '2026-01-17', shift: 'DAY' as const, headcount: 10 },
    { date: '2026-01-17', shift: 'NIGHT' as const, headcount: 6 },
]

// ============================================
// EJECUTAR VALIDACIÓN
// ============================================

console.log('⚠️  DATASET: Volumen creciente lineal (120→200)')
console.log('⚠️  EXPECTATIVA: Modelo debería subestimar (bias positivo)\n')

runRealDataValidation(historicalLoads, futureLoads, plannedAgents)
