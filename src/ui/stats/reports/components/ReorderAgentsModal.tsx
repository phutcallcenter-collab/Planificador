'use client'

import React, { useState, useEffect } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Representative, ShiftType } from '@/domain/types'
import { useAppStore } from '@/store/useAppStore'
import { GripVertical } from 'lucide-react'

interface ReorderAgentsModalProps {
    shift: ShiftType
    isOpen: boolean
    onClose: () => void
}

function SortableItem(props: { id: string; name: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        padding: '12px',
        margin: '0 0 8px 0',
        backgroundColor: isDragging ? '#eef2ff' : 'white',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative' as const,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div style={{ color: 'var(--text-muted)' }}>
                <GripVertical size={16} />
            </div>
            <div style={{ fontWeight: 500, fontSize: '14px' }}>{props.name}</div>
        </div>
    )
}

export function ReorderAgentsModal({ shift, isOpen, onClose }: ReorderAgentsModalProps) {
    const { representatives, reorderRepresentatives } = useAppStore(state => ({
        representatives: state.representatives,
        reorderRepresentatives: state.reorderRepresentatives,
    }))

    // Filtrar y ordenar inicialmente por orderIndex
    const [items, setItems] = useState<Representative[]>([])

    useEffect(() => {
        if (isOpen) {
            const filtered = representatives
                .filter(r => r.baseShift === shift && r.isActive !== false)
                .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            setItems(filtered)
        }
    }, [isOpen, representatives, shift])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (active.id !== over?.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id)
                const newIndex = items.findIndex((i) => i.id === over?.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const handleSave = () => {
        const orderedIds = items.map(r => r.id)
        reorderRepresentatives(shift, orderedIds)
        onClose()
    }

    if (!isOpen) return null

    const modalOverlayStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    }

    const modalContentStyle: React.CSSProperties = {
        background: 'var(--bg-panel)',
        padding: '24px',
        borderRadius: '12px',
        width: '450px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    }

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                <header style={{ marginBottom: '16px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                        Reordenar Agentes ({shift === 'DAY' ? 'Día' : 'Noche'})
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                        Arrastra y suelta para cambiar el orden en reportes y listas.
                    </p>
                </header>

                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px', paddingRight: '4px' }}>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items}
                            strategy={verticalListSortingStrategy}
                        >
                            {items.map(item => (
                                <SortableItem key={item.id} id={item.id} name={item.name} />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid var(--border-strong)',
                            background: 'transparent',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 500,
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: 'var(--accent)',
                            color: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        Guardar Orden
                    </button>
                </div>
            </div>
        </div>
    )
}
