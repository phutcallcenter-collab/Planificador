'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/ui/reports/analysis-beta/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/reports/analysis-beta/ui/card';
import { AnsweredCall, AbandonedCall, Transaction } from '@/domain/call-center-analysis/dashboard.types';
import { useMemo } from 'react';
import { toTimeSlot } from '@/domain/call-center-analysis/time/shiftResolver';
import { formatPercent } from '@/domain/call-center-analysis/utils/format';

interface ShiftDetailTableProps {
  title: string;
  answered: AnsweredCall[];
  abandoned: AbandonedCall[];
  transactions: Transaction[];
}

export default function ShiftDetailTable({ title, answered, abandoned, transactions }: ShiftDetailTableProps) {
  const slotsList = useMemo(() => {
    const s = new Set<string>();

    answered.forEach(c => s.add(toTimeSlot(c.hora)));
    abandoned.forEach(c => s.add(toTimeSlot(c.hora)));
    transactions.forEach(t => s.add(toTimeSlot(t.hora)));

    return Array.from(s).sort();
  }, [answered, abandoned, transactions]);

  // Aggregate by 30-min Interval
  const intervalData = useMemo(() => {
    return slotsList.map(slot => {
      const ans = answered.filter(c => c.periodo === slot);
      const abn = abandoned.filter(c => c.periodo === slot);
      const trx = transactions.filter(t => t.periodo === slot);

      const answeredCount = ans.reduce((acc, c) => acc + c.llamadas, 0);

      return {
        slot,
        answered: answeredCount,
        abandoned: abn.length,
        transactions: trx.length,
        conversion: answeredCount > 0 ? (trx.length / answeredCount) * 100 : 0
      };
    });
  }, [slotsList, answered, abandoned, transactions]);

  if (slotsList.length === 0) return (
    <Card>
      <CardContent className="p-6 text-center text-muted-foreground">
        No hay datos para {title}
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead className="text-right">Contestadas</TableHead>
              <TableHead className="text-right">Abandonadas</TableHead>
              <TableHead className="text-right">Transacciones</TableHead>
              <TableHead className="text-right">Conv %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {intervalData.map((row) => (
              <TableRow key={row.slot}>
                <TableCell>{row.slot}</TableCell>
                <TableCell className="text-right">{row.answered}</TableCell>
                <TableCell className="text-right">{row.abandoned}</TableCell>
                <TableCell className="text-right">{row.transactions}</TableCell>
                <TableCell className="text-right">{formatPercent(row.conversion)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Remove dummy array

