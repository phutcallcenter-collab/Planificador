'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/reports/analysis-beta/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/reports/analysis-beta/ui/table'
import { useOperationalDashboardStore } from '@/store/useOperationalDashboardStore'
import { formatCurrency } from '@/domain/call-center-analysis/utils/format'

export default function SalesByAgentTable() {
    const attribution = useOperationalDashboardStore(
        s => s.data.salesAttribution
    )

    if (!attribution || attribution.byAgent.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                    No hay ventas atribuibles a Call Center.
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-semibold flex justify-between items-center">
                    <span>Ventas por Representante (Call Center)</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">Atribución CC</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="h-8 text-[11px]">Agente</TableHead>
                            <TableHead className="h-8 text-[11px] text-right">Trx</TableHead>
                            <TableHead className="h-8 text-[11px] text-right">Ventas</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {attribution.byAgent.map(a => (
                            <TableRow key={a.agentName}>
                                <TableCell className="py-2 text-xs font-medium">{a.agentName}</TableCell>
                                <TableCell className="py-2 text-xs text-right text-muted-foreground">{a.transactions}</TableCell>
                                <TableCell className="py-2 text-xs text-right font-semibold">
                                    {formatCurrency(a.totalValue)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {(attribution.unattributedValue > 0) && (
                    <div className="mt-4 pt-4 border-t border-dashed flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                            <span>Ventas No Atribuibles (Otros Canales)</span>
                            <span className="font-bold">{formatCurrency(attribution.unattributedValue)}</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground leading-tight italic">
                            * App, Web y Agregadores se contabilizan únicamente a nivel global para evitar inflación en el desempeño individual.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
