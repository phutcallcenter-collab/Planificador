'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/ui/reports/analysis-beta/ui/button';
import { Upload, FileCheck, AlertTriangle } from 'lucide-react';
import { useOperationalDashboardStore } from '@/store/useOperationalDashboardStore';
import {
    parseCsvFile,
    parseXlsxFile,
    // readExcelHeaders, // Removed
    processAnsweredCalls,
    processAbandonedCalls,
    processTransactions
} from '@/domain/call-center-analysis/parser.service';
import { SalesAttributionService } from '@/domain/call-center-analysis/services/SalesAttributionService';
import { KPIService } from '@/domain/call-center-analysis/kpi.service';
import { ActualOperationalLoadBuilder } from '@/domain/call-center-analysis/builder/ActualOperationalLoadBuilder';
import { AnsweredCall, AbandonedCall, Transaction } from '@/domain/call-center-analysis/dashboard.types';
import { PredictionService } from '@/domain/call-center-analysis/prediction/PredictionService';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from '@/domain/reporting/types';
import { AnalysisPersistence } from '@/infra/persistence/analysis-session.db';
import { AnalysisSession } from '@/store/useOperationalDashboardStore';
import { parseISO, differenceInDays } from 'date-fns';
import SessionHistory from './SessionHistory';

// Validation Services
import { FileNameValidationService } from '@/domain/call-center-analysis/services/FileNameValidationService';
import { DateRangeValidationService } from '@/domain/call-center-analysis/services/DateRangeValidationService';
import { buildFileNameErrorMessage } from '@/ui/reports/analysis-beta/ux/fileValidationMessages';
import { buildDateRangeErrorMessage } from '@/ui/reports/analysis-beta/ux/dateRangeMessages';

export default function FileLoadButtons() {
    const { startAnalysis, toggleAudit, isAuditVisible } = useOperationalDashboardStore();
    const { toast } = useToast();

    const [files, setFiles] = useState<{
        answered: File | null;
        abandoned: File | null;
        transactions: File | null;
    }>({ answered: null, abandoned: null, transactions: null });

    const [status, setStatus] = useState<'IDLE' | 'PARSING' | 'READY'>('IDLE');

    const answeredInputRef = useRef<HTMLInputElement>(null);
    const abandonedInputRef = useRef<HTMLInputElement>(null);
    const transactionsInputRef = useRef<HTMLInputElement>(null);

    // Auto-Analyze when files change
    React.useEffect(() => {
        const hasAnyFile = files.answered || files.abandoned || files.transactions;
        if (hasAnyFile) {
            processFiles();
        }
    }, [files]);

    const handleFileChange = (type: keyof typeof files, ref: React.RefObject<HTMLInputElement>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Immediate Validation (UX: Fail Fast)
        // Check ONLY the file currently being uploaded
        const errors = FileNameValidationService.validate({ [type]: file });

        if (errors.length > 0) {
            toast({
                title: 'Archivo incorrecto',
                description: buildFileNameErrorMessage(errors),
                variant: 'destructive',
            });
            // Reset input so user can try again immediately
            if (ref.current) ref.current.value = '';
            return;
        }

        setFiles(prev => ({ ...prev, [type]: file }));
    };

    const processFiles = async () => {
        // Note: Partial processing is allowed now.

        try {
            setStatus('PARSING');
            startAnalysis();

            // 2. Parse Available Files
            // If a file is missing, we use an empty array.
            const rawAnswered = files.answered ? await parseXlsxFile<Record<string, unknown>>(files.answered) : [];
            const rawAbandoned = files.abandoned ? await parseXlsxFile<Record<string, unknown>>(files.abandoned) : [];
            const rawTransactions = files.transactions ? await parseXlsxFile<Record<string, unknown>>(files.transactions) : [];

            // 3. Process Domain Objects
            const answered = processAnsweredCalls(rawAnswered);
            const abandoned = processAbandonedCalls(rawAbandoned);
            const transactions = processTransactions(rawTransactions);

            // 4. Validation Phase 3: Date Range Consistency (The "Golden Rule")
            // We only validate ranges for files that actually exist.
            const datesAnswered = files.answered ? getUniqueDates(answered.map(c => c.fecha)) : undefined;
            const datesAbandoned = files.abandoned ? getUniqueDates(abandoned.clean.map(c => c.fecha)) : undefined;
            const datesTransactions = files.transactions ? getUniqueDates(transactions.clean.map(c => c.fecha)) : undefined;

            const rangeResult = DateRangeValidationService.validate({
                answered: datesAnswered,
                abandoned: datesAbandoned,
                transactions: datesTransactions,
            });

            if (!rangeResult.valid) {
                // Even if partial, if there is a detected mismatch (e.g. Answered vs Abandoned), we MUST warn.
                // We don't wipe the dashboard, but we warn the user. 
                // Actually, if dates mismatch, KPIs are invalid. We should probably NOT update the store.
                toast({
                    title: 'Rango de fechas incompatible',
                    description: buildDateRangeErrorMessage(rangeResult.errors),
                    variant: 'destructive',
                });
                setStatus('IDLE');
                return;
            }

            const range: DateRange | null = rangeResult.range || null;

            // 5. Compute KPIs (Robust to empty arrays)
            const kpis = KPIService.calculateKPIs(answered, abandoned.clean, transactions.clean);
            const kpisByShift = KPIService.calculateKPIsByShift(answered, abandoned.raw, transactions.clean);

            // 5.5. Calculate Attribution (Restricted to Call Center)
            const salesAttribution = SalesAttributionService.attribute(transactions.clean);

            // 5.8. Final Prediction Engine Implementation (Honest V1)
            // We use history-based trends and ranges for realistic forecasting.
            const historicalLoad = ActualOperationalLoadBuilder.build(answered, abandoned.raw, transactions.clean);
            const predictedLoad = range
                ? PredictionService.generate(
                    range.from,
                    7,
                    historicalLoad.map(h => ({
                        date: h.date,
                        shift: h.shift,
                        receivedCalls: h.receivedCalls
                    }))
                )
                : [];

            // 6. Construct Session
            const session: AnalysisSession = {
                status: 'READY',
                scope: { range: range, source: 'GENERIC_CSV' },
                data: {
                    answered,
                    abandoned: { clean: abandoned.clean, raw: abandoned.raw },
                    transactions: transactions.clean,
                    salesAttribution, // NEW: Restricted attribution
                    stats: transactions.stats, // NEW: Filter statistics
                    predictedLoad
                },
                metrics: { kpis, kpisByShift }
            };

            // 7. Update Store
            useOperationalDashboardStore.getState().restoreSession(session);
            await AnalysisPersistence.saveSession(session);

            const detectedHeaders = rawTransactions.length > 0 ? Object.keys(rawTransactions[0]).slice(0, 5).join(', ') : 'Ninguna fila encontrada';

            toast({
                title: transactions.clean.length === 0 && transactions.raw.length > 0
                    ? 'Error de Formato: Columnas no reconocidas'
                    : 'Datos Procesados Correctamente',
                description: (
                    <div className="flex flex-col gap-1">
                        <span>Generales:</span>
                        <span className="text-xs">
                            📞 Contestadas: {answered.length} | 🚫 Abandonadas: {abandoned.clean.length}
                        </span>
                        <span className="font-semibold mt-1">Transacciones (Filtros de Integridad):</span>
                        <span className="text-xs">
                            📥 Leídas: {transactions.raw.length} | ✅ Válidas: {transactions.clean.length}
                        </span>
                        {(transactions.stats.ignored > 0 || transactions.stats.duplicates > 0) && (
                            <span className="text-[10px] text-muted-foreground flex gap-2 mt-0.5">
                                <span>❌ Anuladas: {transactions.stats.ignored}</span>
                                <span>👯 Duplicadas: {transactions.stats.duplicates}</span>
                            </span>
                        )}
                        {transactions.clean.length === 0 && transactions.raw.length > 0 && (
                            <div className="mt-2 p-2 bg-red-100 text-red-800 text-xs rounded border border-red-200">
                                <strong>Columnas encontradas (Primeras 5):</strong><br />
                                {detectedHeaders}
                                <br /><br />
                                <strong>Esperamos:</strong> Estatus, Valor, Sucursal.
                            </div>
                        )}
                    </div>
                ),
                variant: transactions.clean.length === 0 && files.transactions ? 'destructive' : 'default',
            });

            setStatus('READY');

        } catch (e: any) {
            console.error(e);
            toast({ title: 'Error al procesar', description: e.message, variant: 'destructive' });
            setStatus('IDLE');
        }
    };

    return (
        <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-2">
                <UploadButton label="Contestadas" inputRef={answeredInputRef} file={files.answered} onChange={handleFileChange('answered', answeredInputRef)} accept=".xlsx, .xls" />
                <UploadButton label="Abandonadas" inputRef={abandonedInputRef} file={files.abandoned} onChange={handleFileChange('abandoned', abandonedInputRef)} accept=".xlsx, .xls" />
                <UploadButton label="Transacciones" inputRef={transactionsInputRef} file={files.transactions} onChange={handleFileChange('transactions', transactionsInputRef)} accept=".xlsx, .xls" />
            </div>

            {/* Analyze Button Removed - Auto execution */}

            <div className="ml-2 flex items-center gap-2">
                {status === 'PARSING' && <span className="text-xs text-muted-foreground animate-pulse">Procesando...</span>}
            </div>

            <Button variant="ghost" size="icon" onClick={toggleAudit} className={isAuditVisible ? "bg-accent" : ""}>
                <FileCheck className="h-4 w-4" />
            </Button>

            <SessionHistory />
        </div>
    );
}

interface UploadButtonProps {
    label: string;
    inputRef: React.RefObject<HTMLInputElement>;
    file: File | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    accept: string;
}

function UploadButton({ label, inputRef, file, onChange, accept }: UploadButtonProps) {
    return (
        <div>
            <input
                type="file"
                ref={inputRef}
                onChange={onChange}
                accept={accept}
                className="hidden"
                style={{ display: 'none' }}
            />
            <Button
                variant={file ? "outline" : "outline"}
                size="sm"
                onClick={() => inputRef.current?.click()}
                className={file ? "border-green-500 text-green-600 bg-green-50" : "border-dashed"}
            >
                {file ? <FileCheck className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                {file ? 'Cargado' : label}
            </Button>
        </div>
    );
}

// Helper Utils locally for now
function getUniqueDates(dates: string[]) {
    return Array.from(new Set(dates)).sort();
}
function getRange(dates: string[]): DateRange {
    if (dates.length === 0) return { from: '', to: '' }; // Should handle empty
    return { from: dates[0], to: dates[dates.length - 1] };
}
