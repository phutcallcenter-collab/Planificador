'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/ui/reports/analysis-beta/ui/sheet";
import { useOperationalDashboardStore } from "@/store/useOperationalDashboardStore";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/ui/reports/analysis-beta/ui/table";

export default function AuditView() {
    const { isAuditVisible, toggleAudit, data } = useOperationalDashboardStore();

    const transactions = data?.transactions?.length ?? 0;
    const answered = data?.answered?.length ?? 0;
    const abandoned = data?.abandoned?.clean?.length ?? 0;
    const abandonedRaw = data?.abandoned?.raw?.length ?? 0;

    return (
        <Sheet open={isAuditVisible} onOpenChange={toggleAudit}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Auditoría de Datos</SheetTitle>
                    <SheetDescription>
                        Resumen de los datos cargados en memoria.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                        <Stat label="Contestadas" value={answered} />
                        <Stat label="Recibidas (Calc)" value={answered + abandonedRaw} />
                        <Stat label="Aband. (Clean)" value={abandoned} />
                        <Stat label="Aband. (Raw)" value={abandonedRaw} />
                        <Stat label="Transacciones" value={transactions} />
                    </div>

                    <div className="border rounded-md p-4 bg-muted/50">
                        <h4 className="text-sm font-medium mb-2">Estructura de Datos (Muestra)</h4>
                        <pre className="text-xs overflow-x-auto">
                            {JSON.stringify({
                                answered: data?.answered?.slice(0, 1),
                                abandonedClean: data?.abandoned?.clean?.slice(0, 1),
                                abandonedRaw: data?.abandoned?.raw?.slice(0, 1),
                                transactions: data?.transactions?.slice(0, 1)
                            }, null, 2)}
                        </pre>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function Stat({ label, value }: { label: string, value: number }) {
    return (
        <div className="text-center p-3 border rounded bg-card">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground uppercase">{label}</div>
        </div>
    );
}
