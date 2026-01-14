import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Representative } from '@/domain/types'
import { Edit, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useEditMode } from '@/hooks/useEditMode'
import { SpecialScheduleList } from './SpecialScheduleList'
import { SpecialScheduleWizard } from './SpecialScheduleWizard'
import { Tooltip } from '@/ui/components/Tooltip'

interface SortableRepCardProps {
    rep: Representative
    onEdit: (rep: Representative) => void
    onAddSchedule: (repId: string) => void
    addingScheduleFor: string | null
    advancedEditMode: boolean
}

export function SortableRepCard({ rep, onEdit, onAddSchedule, addingScheduleFor, advancedEditMode }: SortableRepCardProps) {
    const deactivateRepresentative = useAppStore(s => s.deactivateRepresentative)
    const { mode } = useEditMode()

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: rep.id })

    const style = advancedEditMode ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    } : {}

    return (
        <div
            ref={advancedEditMode ? setNodeRef : undefined}
            style={{
                ...style,
                padding: '16px',
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Handle de drag (EXPLÍCITO) - Solo visible en modo avanzado */}
                    {advancedEditMode && (
                        <Tooltip content="Arrastra para reordenar">
                            <span
                                {...attributes}
                                {...listeners}
                                style={{
                                    cursor: 'grab',
                                    padding: '8px',
                                    fontSize: '18px',
                                    color: '#9ca3af',
                                    userSelect: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                ≡
                            </span>
                        </Tooltip>
                    )}

                    {/* Contenido */}
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
                            {rep.name}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Rol: {rep.role === 'CUSTOMER_SERVICE' ? 'Servicio al Cliente' : 'Ventas'} | Turno: {rep.baseShift === 'DAY' ? 'Día' : 'Noche'}{' '}
                            {rep.mixProfile && `(Mixto ${rep.mixProfile.type === 'WEEKDAY' ? 'L-J' : 'V-D'})`}
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => onEdit(rep)}
                        style={{ padding: '8px', background: '#f3f4f6', border: '1px solid var(--border-subtle)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-main)' }}
                        title="Editar"
                    >
                        <Edit size={16} />
                    </button>
                    {mode === 'ADMIN_OVERRIDE' && (
                        <button
                            onClick={() => deactivateRepresentative(rep.id)}
                            style={{ padding: '8px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '4px', cursor: 'pointer', color: '#b91c1c' }}
                            title="Desactivar"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            <SpecialScheduleList repId={rep.id} />
            {addingScheduleFor === rep.id ? (
                <SpecialScheduleWizard repId={rep.id} repName={rep.name} onSave={() => onAddSchedule(null as any)} />
            ) : (
                <div style={{ marginTop: '12px' }}>
                    <button onClick={() => onAddSchedule(rep.id)} style={{ fontSize: '12px', fontWeight: 500, color: '#4338ca', background: 'none', border: 'none', cursor: 'pointer' }}>+ Añadir horario especial</button>
                </div>
            )}
        </div>
    )
}

