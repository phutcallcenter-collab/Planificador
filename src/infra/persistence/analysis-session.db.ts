import { openDB, DBSchema } from 'idb';
import { AnalysisSession } from '@/store/useOperationalDashboardStore';
import { DateRange } from '@/domain/reporting/types';

interface AnalysisDB extends DBSchema {
    sessions: {
        key: string;
        value: SavedSession;
    };
}

export interface SavedSession {
    id: string; // Format: YYYY-MM-DD_YYYY-MM-DD
    createdCheck: number;
    label: string; // e.g. "Enero 2024"
    scope: AnalysisSession['scope'];
    data: AnalysisSession['data'];
    metrics: AnalysisSession['metrics'];
}

export type SessionSummary = Pick<SavedSession, 'id' | 'createdCheck' | 'label' | 'scope'>;

const DB_NAME = 'analysis-db';
const STORE_NAME = 'sessions';

export const AnalysisPersistence = {
    async getDB() {
        return openDB<AnalysisDB>(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            },
        });
    },

    async saveSession(session: AnalysisSession): Promise<string> {
        if (!session.scope.range) throw new Error("Cannot save session without a date range");

        const db = await this.getDB();
        const range = session.scope.range;
        const id = `${range.from}_${range.to}`;

        // Create a label (could be better formatted)
        const label = `${range.from} - ${range.to}`;

        const saved: SavedSession = {
            id,
            createdCheck: Date.now(),
            label,
            scope: session.scope,
            data: session.data,
            metrics: session.metrics
        };

        await db.put(STORE_NAME, saved);
        return id;
    },

    async getSessions(): Promise<SessionSummary[]> {
        const db = await this.getDB();
        const sessions = await db.getAll(STORE_NAME);
        // Return lightweight summary
        return sessions.map(s => ({
            id: s.id,
            createdCheck: s.createdCheck,
            label: s.label,
            scope: s.scope
        })).sort((a, b) => b.id.localeCompare(a.id)); // Newer dates first roughly
    },

    async loadSession(id: string): Promise<SavedSession | undefined> {
        const db = await this.getDB();
        return db.get(STORE_NAME, id);
    },

    async deleteSession(id: string): Promise<void> {
        const db = await this.getDB();
        await db.delete(STORE_NAME, id);
    }
};
