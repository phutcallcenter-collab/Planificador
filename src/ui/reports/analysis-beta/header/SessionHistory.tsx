'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/ui/reports/analysis-beta/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/ui/reports/analysis-beta/ui/sheet';
import { AnalysisPersistence, SessionSummary } from '@/infra/persistence/analysis-session.db';
import { useOperationalDashboardStore } from '@/store/useOperationalDashboardStore';
import { useToast } from '@/hooks/use-toast';
import { History, Trash2, Database } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SessionHistory() {
    const [isOpen, setIsOpen] = useState(false);
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const { restoreSession } = useOperationalDashboardStore();
    const { toast } = useToast();

    const loadList = async () => {
        try {
            const list = await AnalysisPersistence.getSessions();
            setSessions(list);
        } catch (e) {
            console.error(e);
            toast({ title: 'Error cargando historial', variant: 'destructive' });
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadList();
        }
    }, [isOpen]);

    const handleRestore = async (id: string) => {
        try {
            const session = await AnalysisPersistence.loadSession(id);
            if (session) {
                // Convert SavedSession (wraps AnalysisSession) back to AnalysisSession state
                // SavedSession HAS { scope, data, metrics } just like AnalysisSession
                // But AnalysisSession also has 'status'.
                const fullSession = {
                    status: 'READY' as const,
                    scope: session.scope,
                    data: session.data,
                    metrics: session.metrics
                };
                restoreSession(fullSession);
                toast({ title: 'Sesión restaurada', description: session.label });
                setIsOpen(false);
            }
        } catch (e) {
            console.error(e);
            toast({ title: 'Error al restaurar', variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await AnalysisPersistence.deleteSession(id);
            loadList(); // Refresh
            toast({ title: 'Sesión eliminada' });
        } catch (e) {
            toast({ title: 'Error al eliminar', variant: 'destructive' });
        }
    };

    return (
        <>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} title="Historial">
                <History className="h-4 w-4" />
            </Button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Historial de Análisis</SheetTitle>
                        <SheetDescription>
                            Sesiones guardadas en tu navegador.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                        {sessions.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <Database className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p>No hay sesiones guardadas.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {sessions.map(s => (
                                    <div
                                        key={s.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => handleRestore(s.id)}
                                    >
                                        <div>
                                            <div className="font-medium">{s.label}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Analizado el {format(s.createdCheck, "d MMM, HH:mm", { locale: es })}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={(e) => handleDelete(s.id, e)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
