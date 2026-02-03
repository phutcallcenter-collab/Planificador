'use client';

import { useRef } from 'react';
import { Button } from '@/ui/reports/analysis-beta/ui/button';
import { Upload } from 'lucide-react';
import { useOperationalDashboardStore } from '@/store/useOperationalDashboardStore';
import { parseCsvFile, parseXlsxFile } from '@/domain/operational/parser.service';
import type { AnsweredCall, AbandonedCall, Transaction } from '@/types';

export function DashboardHeader() {
  const { setAnsweredCalls, setAbandonedCalls, setTransactions } =
    useOperationalDashboardStore();

  const answeredInputRef = useRef<HTMLInputElement>(null);
  const abandonedInputRef = useRef<HTMLInputElement>(null);
  const transactionsInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: 'answered' | 'abandoned' | 'transactions'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (fileType === 'answered') {
        const data = await parseCsvFile<AnsweredCall>(file);
        console.log('Contestadas:', data);
        setAnsweredCalls(data.filter((row) => row.ID_Llamada));
      } else if (fileType === 'abandoned') {
        const data = await parseCsvFile<AbandonedCall>(file);
        console.log('Abandonadas:', data);
        setAbandonedCalls(data.filter((row) => row.ID_Llamada));
      } else if (fileType === 'transactions') {
        const data = await parseXlsxFile<Transaction>(file);
        console.log('Transacciones:', data);
        setTransactions(data.filter((row) => row['ID Transaccion']));
      }
    } catch (error) {
      console.error('Error parsing file:', error);
    }

    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        ref={answeredInputRef}
        className="hidden"
        accept=".csv"
        onChange={(e) => handleFileChange(e, 'answered')}
      />
      <input
        type="file"
        ref={abandonedInputRef}
        className="hidden"
        accept=".csv"
        onChange={(e) => handleFileChange(e, 'abandoned')}
      />
      <input
        type="file"
        ref={transactionsInputRef}
        className="hidden"
        accept=".xlsx, .xls"
        onChange={(e) => handleFileChange(e, 'transactions')}
      />
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
        <div className="flex-1">
          <h1 className="text-xl font-semibold sm:text-2xl">
            Call Analytics Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => answeredInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Cargar Contestadas
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => abandonedInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Cargar Abandonadas
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
            onClick={() => transactionsInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Cargar Transacciones
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="sm:hidden"
            onClick={() => answeredInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            <span className="sr-only">Upload Files</span>
          </Button>
        </div>
      </header>
    </>
  );
}
