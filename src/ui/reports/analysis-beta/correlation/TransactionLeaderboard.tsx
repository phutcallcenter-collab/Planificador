'use client';

import React, { useMemo, useState } from 'react';
import { Transaction } from '@/domain/call-center-analysis/dashboard.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
    Trophy,
    Search,
    TrendingUp,
    DollarSign,
    Hash,
    Filter
} from 'lucide-react';

interface Props {
    transactions: Transaction[];
}

interface AgentStats {
    name: string;
    count: number;
    totalValue: number;
    avgTicket: number;
}

export function TransactionLeaderboard({ transactions }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [minTrxFilter, setMinTrxFilter] = useState(5); // Filter noise by default

    const stats: AgentStats[] = useMemo(() => {
        const map = new Map<string, { count: number; val: number }>();

        transactions.forEach(t => {
            // Normalize name to avoid "Juan" vs "juan" duplicates
            const rawName = t.agentName?.trim();
            if (!rawName) return;

            // Filter out system platforms if they appear in 'registro' (just in case)
            const ignore = ['WEB', 'APP', 'WA', 'BOT', 'AG'];
            if (ignore.includes(rawName.toUpperCase())) return;

            const key = rawName.toLowerCase();
            const current = map.get(key) || { count: 0, val: 0 };

            map.set(key, {
                count: current.count + 1,
                val: current.val + (t.valor || 0)
            });
        });

        return Array.from(map.entries()).map(([name, data]) => ({
            name: name.toUpperCase(), // Display consistency
            count: data.count,
            totalValue: data.val,
            avgTicket: data.count > 0 ? data.val / data.count : 0
        }))
            .sort((a, b) => b.totalValue - a.totalValue); // Sort by revenue by default

    }, [transactions]);

    const filteredStats = useMemo(() => {
        return stats.filter(s =>
            s.count >= minTrxFilter &&
            s.name.includes(searchTerm.toUpperCase())
        );
    }, [stats, searchTerm, minTrxFilter]);

    const totalRevenue = filteredStats.reduce((acc, s) => acc + s.totalValue, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        Ranking de Ventas (Provisional)
                    </h2>
                    <p className="text-muted-foreground">
                        Basado en la columna "registro" del archivo de transacciones.
                    </p>
                </div>

                <div className="flex gap-2 items-center">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar agente..."
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-secondary/20 p-2 rounded-md border border-secondary">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Mín. Trx:</span>
                        <input
                            type="number"
                            min="1"
                            className="w-12 text-center text-sm bg-transparent border-b border-muted-foreground/30 focus:outline-none focus:border-primary"
                            value={minTrxFilter}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinTrxFilter(Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredStats.slice(0, 3).map((agent, idx) => (
                    <Card key={agent.name} className={`relative overflow-hidden ${idx === 0 ? 'border-yellow-400/50 bg-yellow-50/10' : ''}`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Trophy className="h-24 w-24" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardDescription>Top #{idx + 1}</CardDescription>
                            <CardTitle className="text-xl">{agent.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold mb-1">
                                ${agent.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {agent.count} Trx</span>
                                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> ${agent.avgTicket.toFixed(0)} Tkt</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Agente / Usuario</TableHead>
                            <TableHead className="text-right">Transacciones</TableHead>
                            <TableHead className="text-right">Venta Total</TableHead>
                            <TableHead className="text-right">Ticket Promedio</TableHead>
                            <TableHead className="text-right">% del Total visible</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStats.map((agent, idx) => (
                            <TableRow key={agent.name}>
                                <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                                <TableCell className="font-semibold">{agent.name}</TableCell>
                                <TableCell className="text-right">{agent.count}</TableCell>
                                <TableCell className="text-right font-mono">
                                    ${agent.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-right font-mono text-muted-foreground">
                                    ${agent.avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground">
                                    {((agent.totalValue / totalRevenue) * 100).toFixed(1)}%
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
