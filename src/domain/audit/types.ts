import { ISODate, RepresentativeId } from '../types'

export type AuditEventType =
  | 'COVERAGE_CREATED'
  | 'COVERAGE_CANCELLED'
  | 'INCIDENT_CREATED'
  | 'INCIDENT_REMOVED'
  | 'SWAP_APPLIED'
  | 'OVERRIDE_APPLIED'
  | 'SNAPSHOT_CREATED'

export interface AuditEvent {
  id: string
  timestamp: string // ISODateTime

  // Core Identity
  actor: { id: string; name: string } | 'SYSTEM' | 'USER'

  // Action
  action: string // e.g. 'INCIDENT_CREATED', 'OVERRIDE_APPLIED'

  // Target Scope
  target: {
    entity: string // 'INCIDENT', 'SHIFT', 'REPRESENTATIVE'
    entityId?: string
  }

  // Changes
  change?: {
    field: string
    from: unknown
    to: unknown
  }

  // Context
  context?: Record<string, unknown>

  // Legacy/Generic payload support (optional)
  payload?: unknown

  // Legacy type support
  type?: AuditEventType
  repId?: string
}
