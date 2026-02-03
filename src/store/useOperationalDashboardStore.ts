import { create } from 'zustand';
import type {
  AnsweredCall,
  AbandonedCall,
  Transaction,
  KPIs,
  ShiftKPIs,
} from '@/domain/call-center-analysis/dashboard.types';
import { DateRange } from '@/domain/reporting/types';

export interface AnalysisSession {
  status: 'IDLE' | 'ANALYZING' | 'READY' | 'ERROR';

  scope: {
    range: DateRange | null;
    source: 'GENERIC_CSV' | 'MASTER_EXCEL' | null;
  };

  data: {
    answered: AnsweredCall[];
    abandoned: {
      clean: AbandonedCall[];
      raw: AbandonedCall[];
    };
    transactions: Transaction[];
    salesAttribution?: import('@/domain/call-center-analysis/services/SalesAttributionService').SalesAttributionResult;
    stats?: {
      ignored: number;
      duplicates: number;
    };
    predictedLoad?: import('@/domain/call-center-analysis/prediction/PredictionService').PredictionResult[];
  };

  metrics: {
    kpis: KPIs;
    kpisByShift: {
      Día: ShiftKPIs;
      Noche: ShiftKPIs;
    };
  };
}

// ... UI State ...
export interface DashboardUiState {
  hourlyChartShift: 'Día' | 'Noche';
  salesChartMode: 'agg' | 'daily';
  aovChartMode: 'agg' | 'daily';
  isAuditVisible: boolean;
  showPrediction: boolean;
  dataDate: string | null;

  // Actions
  setHourlyChartShift: (shift: 'Día' | 'Noche') => void;
  setSalesChartMode: (mode: 'agg' | 'daily') => void;
  setAovChartMode: (mode: 'agg' | 'daily') => void;
  toggleAudit: () => void;
  togglePrediction: () => void;
  setDataDate: (date: string | null) => void;
}

export type OperationalStore = AnalysisSession & DashboardUiState & {
  // Actions
  startAnalysis: () => void;
  setAnalysisData: (payload: {
    range: DateRange | null;
    answered: AnsweredCall[];
    abandoned: { clean: AbandonedCall[]; raw: AbandonedCall[] };
    transactions: Transaction[];
    stats?: { ignored: number; duplicates: number };
    kpis: KPIs;
    kpisByShift: { Día: ShiftKPIs; Noche: ShiftKPIs };
    predictedLoad?: import('@/domain/call-center-analysis/prediction/PredictionService').PredictionResult[];
  }) => void;
  clearSession: () => void;
  setError: () => void;
  restoreSession: (saved: AnalysisSession) => void;
};

const initialSession: AnalysisSession = {
  status: 'IDLE',
  scope: { range: null, source: null },
  data: { answered: [], abandoned: { clean: [], raw: [] }, transactions: [] },
  metrics: {
    kpis: {
      recibidas: 0, contestadas: 0, abandonadas: 0,
      nivelDeServicio: 0, conversion: 0, transaccionesCC: 0, abandonoPct: 0
    },
    kpisByShift: {
      Día: { recibidas: 0, contestadas: 0, trans: 0, conv: 0, abandonadas: 0, duplicadas: 0, lt20: 0, atencion: 0, abandonoPct: 0 },
      Noche: { recibidas: 0, contestadas: 0, trans: 0, conv: 0, abandonadas: 0, duplicadas: 0, lt20: 0, atencion: 0, abandonoPct: 0 },
    },
  },
};

export const useOperationalDashboardStore = create<OperationalStore>((set) => ({
  ...initialSession,

  // ... UI Defaults ...
  hourlyChartShift: 'Día',
  salesChartMode: 'agg',
  aovChartMode: 'agg',
  isAuditVisible: false,
  showPrediction: false,
  dataDate: null,

  startAnalysis: () => set({ status: 'ANALYZING' }),

  setAnalysisData: ({ range, answered, abandoned, transactions, stats, kpis, kpisByShift, predictedLoad }) => set({
    status: 'READY',
    scope: { range, source: 'GENERIC_CSV' },
    data: {
      answered,
      abandoned,
      transactions,
      stats,
      predictedLoad: predictedLoad ?? []
    },
    metrics: { kpis, kpisByShift },
    dataDate: range ? range.from : null,
  }),

  clearSession: () => set({
    ...initialSession,
    status: 'IDLE',
    dataDate: null
  }),
  setError: () => set({ status: 'ERROR' }),
  restoreSession: (saved: AnalysisSession) => {
    // Defensive migration for legacy sessions where abandoned might be an array
    const abandonedData = Array.isArray(saved.data.abandoned)
      ? { clean: saved.data.abandoned, raw: saved.data.abandoned }
      : saved.data.abandoned;

    set({
      status: 'READY',
      scope: saved.scope,
      data: {
        ...saved.data,
        abandoned: abandonedData,
        predictedLoad: saved.data.predictedLoad ?? []
      },
      metrics: saved.metrics,
      dataDate: saved.scope.range?.from || null
    });
  },

  setHourlyChartShift: (shift: 'Día' | 'Noche') => set({ hourlyChartShift: shift }),
  setSalesChartMode: (mode: 'agg' | 'daily') => set({ salesChartMode: mode }),
  setAovChartMode: (mode: 'agg' | 'daily') => set({ aovChartMode: mode }),
  toggleAudit: () => set((state: OperationalStore) => ({ isAuditVisible: !state.isAuditVisible })),
  togglePrediction: () => set((state: OperationalStore) => ({ showPrediction: !state.showPrediction })),
  setDataDate: (date: string | null) => set({ dataDate: date }),
}));
