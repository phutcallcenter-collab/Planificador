import { describe, it, expect, vi, beforeEach } from 'vitest'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Manager } from '@/domain/management/types'

// Minimize the store to just what we need for this test
interface MockAppState {
    managers: Manager[]
    addManager: (data: Omit<Manager, 'id'>) => void
    reorderManagers: (orderedIds: string[]) => void
}

const useMockStore = create<MockAppState>()(
    immer((set) => ({
        managers: [],
        addManager: (data) => {
            set((state) => {
                state.managers.push({ ...data, id: `id-${state.managers.length + 1}` })
            })
        },
        reorderManagers: (orderedIds) => {
            set((state) => {
                const managerMap = new Map(state.managers.map(m => [m.id, m]));
                // The exact logic from useAppStore.ts
                state.managers = orderedIds
                    .map(id => managerMap.get(id))
                    .filter((m): m is Manager => !!m);
            })
        }
    }))
)

describe('Manager Reordering Logic', () => {
    beforeEach(() => {
        useMockStore.setState({ managers: [] })
    })

    it('should reorder managers correctly', () => {
        const store = useMockStore.getState()
        store.addManager({ name: 'Alice' }) // id-1
        store.addManager({ name: 'Bob' })   // id-2
        store.addManager({ name: 'Charlie' }) // id-3

        let state = useMockStore.getState()
        expect(state.managers.map(m => m.name)).toEqual(['Alice', 'Bob', 'Charlie'])

        // Reorder: Charlie, Alice, Bob
        const newOrder = ['id-3', 'id-1', 'id-2']
        store.reorderManagers(newOrder)

        state = useMockStore.getState()
        expect(state.managers.map(m => m.name)).toEqual(['Charlie', 'Alice', 'Bob'])
        expect(state.managers.length).toBe(3)
    })

    it('should handle partial reordering (drop missing IDs) if logic allows', () => {
        const store = useMockStore.getState()
        store.addManager({ name: 'Alice' })
        store.addManager({ name: 'Bob' })

        // Only provide Bob's ID
        store.reorderManagers(['id-2'])

        const state = useMockStore.getState()
        // Our logic filters out missing, so Alice should be gone if not in the list!
        // This confirms the behavior: The UI must send ALL IDs.
        expect(state.managers.map(m => m.name)).toEqual(['Bob'])
    })

    it('should ignore invalid IDs', () => {
        const store = useMockStore.getState()
        store.addManager({ name: 'Alice' })

        store.reorderManagers(['id-1', 'fake-id'])

        const state = useMockStore.getState()
        expect(state.managers.map(m => m.name)).toEqual(['Alice'])
    })
})
