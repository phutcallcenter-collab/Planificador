import * as XLSX from 'xlsx';
import Papa from 'papaparse';

import type {
  AnsweredCall,
  AbandonedCall,
  Transaction,
  TimeSlotKpi,
} from '@/domain/operational/dashboard.types';
import {
  calculateGlobalKpis,
  calculateKPIsByShift,
  aggregateByTimeSlot,
} from './kpi.service';
import {
  getAggregatedSales,
  getSalesByPlatform,
  getAggregatedAov,
  getAovByPlatform,
} from './chart.service';

type ExportData = {
  answeredCalls: AnsweredCall[];
  abandonedCalls: AbandonedCall[];
  rawAbandonedCalls: AbandonedCall[];
  transactions: Transaction[];
};

function buildExportSheets({
  answeredCalls,
  abandonedCalls,
  rawAbandonedCalls,
  transactions,
}: ExportData) {
  const globalKpis = calculateGlobalKpis(
    answeredCalls,
    abandonedCalls,
    transactions
  );
  const shiftKpis = calculateKPIsByShift(
    answeredCalls,
    rawAbandonedCalls,
    transactions
  );
  const timeSlots = aggregateByTimeSlot(
    answeredCalls,
    abandonedCalls,
    transactions
  );

  const kpiSheet = [
    ['KPI', 'Global', 'Día', 'Noche'],
    [
      'Total Recibidas',
      globalKpis.recibidas,
      shiftKpis.Día.recibidas,
      shiftKpis.Noche.recibidas,
    ],
    [
      'Total Contestadas',
      globalKpis.contestadas,
      shiftKpis.Día.contestadas,
      shiftKpis.Noche.contestadas,
    ],
    [
      'Total Abandonadas',
      globalKpis.abandonadas,
      shiftKpis.Día.abandonadas,
      shiftKpis.Noche.abandonadas,
    ],
    [
      '% Atención',
      +globalKpis.nivelDeServicio.toFixed(1),
      +shiftKpis.Día.atencion.toFixed(1),
      +shiftKpis.Noche.atencion.toFixed(1),
    ],
    [
      '% Abandono',
      +(globalKpis.recibidas > 0
        ? (globalKpis.abandonadas / globalKpis.recibidas) * 100
        : 0
      ).toFixed(1),
      +shiftKpis.Día.abandonoPct.toFixed(1),
      +shiftKpis.Noche.abandonoPct.toFixed(1),
    ],
    [
      'Transacciones CC',
      globalKpis.transaccionesCC,
      shiftKpis.Día.trans,
      shiftKpis.Noche.trans,
    ],
    [
      '% Conversión CC',
      +globalKpis.conversion.toFixed(1),
      +shiftKpis.Día.conv.toFixed(1),
      +shiftKpis.Noche.conv.toFixed(1),
    ],
  ];

  const tableHeader = [
    'Hora',
    'Recibidas',
    'Contestadas',
    'ConexiÃ³n',
    'AVG time',
    '% AtenciÃ³n',
    'Abandonadas',
    'ConexiÃ³n',
    'AVG time Aband.',
    '% Abandono',
  ];

  const slotToRow = (s: TimeSlotKpi) => [
    s.hora,
    s.recibidas,
    s.contestadas,
    s.conexionSum.toFixed(4),
    s.conexionAvg.toFixed(1),
    `${s.pctAtencion.toFixed(1)}%`,
    s.abandonadas,
    s.abandConnSum.toFixed(4),
    s.abandAvg.toFixed(1),
    `${s.pctAband.toFixed(1)}%`,
  ];

  const daySheet = [tableHeader, ...timeSlots.day.map(slotToRow)];
  const nightSheet = [tableHeader, ...timeSlots.night.map(slotToRow)];

  const salesAgg = getAggregatedSales(transactions);
  const aovAgg = getAggregatedAov(transactions);
  const salesPlat = getSalesByPlatform(transactions);
  const aovPlat = getAovByPlatform(transactions);

  const ventasSheet: (string | number)[][] = [['Categoría', 'Valor']];
  ventasSheet.push(['Call Center', salesAgg.values[0]]);
  ventasSheet.push(['Resto plataformas', salesAgg.values[1]]);
  salesPlat.labels.forEach((l, i) => {
    ventasSheet.push([l, salesPlat.values[i]]);
  });

  const aovSheet: (string | number)[][] = [['Categoría', 'AOV']];
  aovSheet.push(['Call Center', +aovAgg.values[0].toFixed(2)]);
  aovSheet.push(['Resto plataformas', +aovAgg.values[1].toFixed(2)]);
  aovPlat.labels.forEach((l, i) => {
    aovSheet.push([l, +aovPlat.values[i].toFixed(2)]);
  });

  return {
    KPIs: kpiSheet,
    'Turno DÃ­a': daySheet,
    'Turno Noche': nightSheet,
    Ventas: ventasSheet,
    AOV: aovSheet,
  };
}

export function exportToXlsx(exportData: ExportData) {
  const sheets = buildExportSheets(exportData);
  const workbook = XLSX.utils.book_new();

  for (const sheetName in sheets) {
    const sheetData = sheets[sheetName as keyof typeof sheets];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  XLSX.writeFile(workbook, 'reporte_callcenter.xlsx');
}

export function exportToCsv(exportData: ExportData) {
  const sheets = buildExportSheets(exportData);
  const csvSections: string[] = [];

  for (const sheetName in sheets) {
    csvSections.push(sheetName);
    const sheetData = sheets[sheetName as keyof typeof sheets];
    csvSections.push(Papa.unparse(sheetData));
    csvSections.push(''); // Add a blank line between sections
  }

  const csvContent = csvSections.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'reporte_callcenter.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
