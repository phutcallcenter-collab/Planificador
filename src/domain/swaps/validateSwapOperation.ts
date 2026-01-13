/**
 * 🔒 VALIDACIÓN DE OPERACIONES DE CAMBIO DE TURNO
 *
 * Este módulo implementa las reglas DURAS del dominio para swaps.
 * Validación basada en estado diario efectivo (assignment-based).
 *
 * Ver SWAP_RULES.md para la especificación completa.
 */

import { SwapType, ShiftType, ShiftAssignment } from '../types'

/**
 * Contexto de validación para swaps.
 * Refleja el estado efectivo de cada representante en un día específico.
 */
export interface SwapValidationContext {
  daily: Record<
    string,
    {
      shouldWork: boolean
      assignment: ShiftAssignment | null
      incidentType?: 'VACATION' | 'LEAVE'
    }
  >
}

export type ValidationError = string | null

/**
 * Helper: Verifica si un representante trabaja un turno específico
 */
function worksShift(assignment: ShiftAssignment | null, shift: ShiftType): boolean {
  if (!assignment) return false
  if (assignment.type === 'BOTH') return true
  if (assignment.type === 'SINGLE' && assignment.shift === shift) return true
  return false
}

/**
 * 🎯 VALIDACIÓN DE OPERACIONES DE SWAP
 *
 * Fuente de verdad única basada en estado efectivo.
 * Si esta función retorna null, la operación es válida.
 * Si retorna string, es el mensaje de error.
 */
export function validateSwapOperation(
  type: SwapType,
  fromId: string | undefined,
  toId: string | undefined,
  shift: ShiftType,
  ctx: SwapValidationContext
): ValidationError {
  const get = (id?: string) => (id ? ctx.daily[id] : undefined)

  // ======================
  // Reglas generales
  // ======================
  if (type === 'COVER' || type === 'SWAP') {
    if (!fromId || !toId) return null
    if (fromId === toId) {
      return 'La operación requiere dos personas distintas.'
    }
  }

  if (type === 'DOUBLE') {
    if (!toId) return null
  }

  const from = get(fromId)
  const to = get(toId)

  // ======================
  // COVER
  // ======================
  if (type === 'COVER') {
    if (!from || !to) return 'Representante inválido.'

    // Bloqueos duros
    if (from.incidentType === 'VACATION') {
      return 'No se puede cubrir a alguien de vacaciones.'
    }
    if (from.incidentType === 'LEAVE') {
      return 'No se puede cubrir a alguien de licencia.'
    }
    if (to.incidentType === 'VACATION') {
      return 'No se puede cubrir con alguien de vacaciones.'
    }
    if (to.incidentType === 'LEAVE') {
      return 'No se puede cubrir con alguien de licencia.'
    }

    // El cubierto debe trabajar ese día
    if (!from.shouldWork) {
      return 'No se puede cubrir a alguien que no trabaja ese día.'
    }

    // El cubierto debe trabajar ese turno específico
    if (!worksShift(from.assignment, shift)) {
      return 'No se puede cubrir a alguien que no trabaja ese turno.'
    }

    // El que cubre NO puede estar ocupado en ese turno
    if (worksShift(to.assignment, shift)) {
      return 'El representante que cubre no está disponible en ese horario.'
    }

    return null
  }

  // ======================
  // SWAP
  // ======================
  if (type === 'SWAP') {
    if (!from || !to) return 'Representante inválido.'

    if (from.incidentType === 'VACATION' || from.incidentType === 'LEAVE') {
      return 'No se puede intercambiar con alguien de vacaciones o licencia.'
    }
    if (to.incidentType === 'VACATION' || to.incidentType === 'LEAVE') {
      return 'No se puede intercambiar con alguien de vacaciones o licencia.'
    }

    // Ambos deben trabajar
    if (!from.shouldWork || !to.shouldWork) {
      return 'Ambos representantes deben trabajar ese día para intercambiar.'
    }

    // Si ambos trabajan el mismo turno único, el swap no tiene efecto
    if (
      from.assignment?.type === 'SINGLE' &&
      to.assignment?.type === 'SINGLE' &&
      from.assignment.shift === to.assignment.shift
    ) {
      return 'El intercambio no tiene efecto: ambos trabajan el mismo turno.'
    }

    return null
  }

  // ======================
  // DOUBLE
  // ======================
  if (type === 'DOUBLE') {
    if (!to) return 'Representante inválido.'

    if (to.incidentType === 'VACATION' || to.incidentType === 'LEAVE') {
      return 'No se puede asignar doble turno a alguien de vacaciones o licencia.'
    }

    // Debe trabajar
    if (!to.shouldWork) {
      return 'No se puede asignar doble turno a alguien que no trabaja.'
    }

    // Ya trabaja ambos turnos
    if (to.assignment?.type === 'BOTH') {
      return 'Este representante ya trabaja ambos turnos.'
    }

    // Ya trabaja ESE turno
    if (worksShift(to.assignment, shift)) {
      return 'El representante ya trabaja ese turno.'
    }

    return null
  }

  return 'Operación no válida.'
}
