import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type {
  AnsweredCall,
  AbandonedCall,
  Transaction,
} from '@/domain/call-center-analysis/dashboard.types';
import { getShift } from './shift.service';

export const parseCsvFile = <T>(file: File): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const parseXlsxFile = <T>(file: File): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true,
          dateNF: 'yyyy-mm-dd hh:mm:ss',
        });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          resolve([]);
          return;
        }
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<T>(worksheet, {
          raw: false,
          defval: '',
        });
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsArrayBuffer(file);
  });
};

export const readExcelHeaders = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: false, // No need for dates when reading headers
        });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          resolve([]);
          return;
        }
        const worksheet = workbook.Sheets[sheetName];
        // Read header row only
        const headers = XLSX.utils.sheet_to_json<string[]>(worksheet, {
          header: 1, // Array of arrays
          range: 0, // Read from first row
        })[0];

        resolve(headers ? headers.map(String) : []);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

import { normalizeHour } from './time/normalizeHour';
import { toTimeSlot, resolveShift } from './time/shiftResolver';

// --- Data Processing ---

type RawRow = Record<string, unknown>;

function toNumber(v: unknown): number {
  if (v == null || v === '') return 0;
  const s = String(v).trim().replace(/,/g, '.');
  const m = s.match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : 0;
}

function periodo30(hhmm: string): string {
  return toTimeSlot(hhmm);
}

/**
 * Robustly extracts the 30-minute slot (HH:00 or HH:30)
 * Prioritizes the 'periodo' field if it looks like a time or range.
 */
function extractSlot(rawRow: RawRow, horaNormalizada: string): string {
  const p = mapRawFields(rawRow, ['periodo', 'slot', 'horario']);
  if (p) {
    // If it's a range "10:30 - 11:00", get the first part
    const match = p.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return toTimeSlot(`${match[1]}:${match[2]}`);
    }
  }
  return toTimeSlot(horaNormalizada);
}

function normalizeDate(d: unknown): string {
  if (!d) return '';
  if (d instanceof Date) {
    try {
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localDate = new Date(d.getTime() - tzOffset);
      return localDate.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  }
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const m = s.match(/^(\d{1,2})-([A-Za-z]{3,4})-(\d{2,4})$/);
  if (m) {
    const day = ('0' + m[1]).slice(-2);
    const monStr = m[2].toLowerCase();
    const monMap: { [key: string]: string } = {
      jan: '01', ene: '01', feb: '02', mar: '03', apr: '04', abr: '04',
      may: '05', jun: '06', jul: '07', aug: '08', ago: '08', sep: '09',
      sept: '09', set: '09', oct: '10', nov: '11', dec: '12', dic: '12',
    };
    const mon = monMap[monStr] || '01';
    let year = m[3];
    if (year.length === 2) {
      year = +year >= 70 ? '19' + year : '20' + year;
    }
    return `${year}-${mon}-${day}`;
  }

  const dt = new Date(s);
  if (!isNaN(dt.getTime())) {
    const tzOffset = dt.getTimezoneOffset() * 60000;
    const localDate = new Date(dt.getTime() - tzOffset);
    return localDate.toISOString().slice(0, 10);
  }
  return s;
}

function mapRawFields(rawRow: RawRow, findKeys: string[]): string {
  const normalizedRow: Record<string, unknown> = {};
  Object.keys(rawRow).forEach((k) => {
    const normalizedKey = k
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '');
    normalizedRow[normalizedKey] = rawRow[k];
  });

  for (const key of findKeys) {
    const normalizedKey = key
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '');
    if (Object.prototype.hasOwnProperty.call(normalizedRow, normalizedKey)) {
      return String(normalizedRow[normalizedKey] ?? '');
    }
  }
  return '';
}

export function getUniqueDates(raw: RawRow[]): string[] {
  const dates = raw.map((r) =>
    normalizeDate(mapRawFields(r, ['fecha', 'date', 'dia']))
  );
  return [...new Set(dates.filter((d) => d))];
}

export function processAnsweredCalls(raw: RawRow[]): AnsweredCall[] {
  return raw
    .map((r, index) => {
      const hora = normalizeHour(mapRawFields(r, ['hora', 'time', 'tiempo']));
      const fecha = normalizeDate(mapRawFields(r, ['fecha', 'date', 'dia']));
      const turno = getShift(hora, fecha);

      return {
        id: `ans-${index}`,
        dst: String(
          mapRawFields(r, ['dst', 'destino', 'troncal', 'destination']) || ''
        ),
        fecha,
        periodo: extractSlot(r, hora),
        hora,
        llamadas: toNumber(
          mapRawFields(r, ['llamadas', 'calls', 'count', 'cantidad'])
        ),
        conexion: toNumber(
          mapRawFields(r, [
            'conexion',
            'coneccion',
            'tiempo',
            'duracion',
            'duration',
          ])
        ),
        turno,
      } as AnsweredCall;
    })
    .filter(
      (r) => r.dst !== '8095330202' && r.turno !== 'fuera' && (r.llamadas > 0 || r.conexion > 0)
    );
}

export function processAbandonedCalls(raw: RawRow[]): {
  clean: AbandonedCall[];
  raw: AbandonedCall[];
} {
  const cleanedRaw: AbandonedCall[] = raw
    .map((r, index) => {
      const hora = normalizeHour(mapRawFields(r, ['hora', 'time', 'tiempo']));
      const fecha = normalizeDate(mapRawFields(r, ['fecha', 'date', 'dia']));
      const turno = getShift(hora, fecha);

      return {
        id: `abn-${index}`,
        telefono: String(
          mapRawFields(r, ['telefono', 'phone', 'callerid', 'numero']) || ''
        ),
        fecha,
        hora: hora,
        conexion: toNumber(
          mapRawFields(r, [
            'conexion',
            'coneccion',
            'tiempo',
            'duracion',
            'duration',
          ])
        ),
        periodo: extractSlot(r, hora),
        turno,
        disposition: String(
          mapRawFields(r, ['disposition', 'estado', 'status']) || ''
        ),
      };
    })
    .filter((r) => r.turno !== 'fuera' && (r.telefono !== '' || r.conexion > 0));

  const telCount = new Map<string, number>();
  cleanedRaw.forEach((r) => {
    const k = r.telefono || '';
    telCount.set(k, (telCount.get(k) || 0) + 1);
  });

  const fullRaw = cleanedRaw.map((r) => ({
    ...r,
    isDuplicate: (telCount.get(r.telefono) || 0) > 1,
    isLT20: r.conexion < 20,
  }));

  const clean = fullRaw.filter((r) => !r.isDuplicate && !r.isLT20);

  return { clean, raw: fullRaw };
}

export function processTransactions(raw: RawRow[]): {
  clean: Transaction[];
  raw: Transaction[];
  stats: {
    ignored: number;
    duplicates: number;
  };
} {
  const PLATFORM_LABELS: { [key: string]: string } = {
    CC: 'Call Center',
    APP: 'App',
    WA: 'WhatsApp',
    WEB: 'Web',
    AG: 'Agregadores',
  };

  const resolveCanalReal = (
    tipoFacRaw: string,
    plataformaCode: string
  ): string => {
    if (String(plataformaCode || '').toUpperCase() === 'AG') return 'Agregador';
    const v = String(tipoFacRaw || '').toUpperCase();
    if (v === 'D') return 'Delivery';
    if (v === 'C') return 'Carryout';
    return v || '';
  };

  const allTransactions = raw.map((r, index) => {
    const plataforma = (
      mapRawFields(r, ['canal', 'plataforma']) || ''
    ).toUpperCase();
    const fecha = normalizeDate(mapRawFields(r, ['fecha', 'date', 'dia', 'fecha_compra', 'created_at']));
    const hora = normalizeHour(mapRawFields(r, ['hora', 'time', 'tiempo', 'created_time']));

    return {
      id: `trx-${index}`,
      sucursal: mapRawFields(r, [
        'nom_unidad',
        'nomunidad',
        'sucursal',
        'tienda',
        'unidad',
        'tienda',
        'unidad',
        'branch',
        'store',
        'restaurante'
      ]),
      canalReal: resolveCanalReal(
        mapRawFields(r, ['tipo_fac', 'tipofac', 'tipo_pedido', 'order_type']),
        plataforma
      ),
      plataforma:
        PLATFORM_LABELS[plataforma] || plataforma || 'Sin plataforma',
      plataformaCode: plataforma,
      fecha,
      hora,
      periodo: extractSlot(r, hora),
      estatus: (
        mapRawFields(r, ['estatuscc', 'estatus', 'estado', 'status', 'state', 'situacion']) || ''
      ).toUpperCase(),
      valor: toNumber(mapRawFields(r, ['valor', 'monto', 'total', 'amount', 'price', 'precio', 'importe', 'neto', 'pago'])),
      agentName: mapRawFields(r, ['registro', 'usuario', 'user', 'agente', 'cajero']),
    };
  });

  const uniqueMap = new Map<string, boolean>();
  let ignoredCount = 0;
  let duplicateCount = 0;

  const cleanTransactions = allTransactions.filter((r) => {
    // Normalize status
    const s = r.estatus.trim().toUpperCase();

    // 1. LEGACY REQUIREMENT: Explicitly exclude 'A' (Anulada in legacy datasets)
    if (s === 'A') {
      ignoredCount++;
      return false;
    }

    // 2. ROBUST FUZZY MATCH: Exclude any status containing these signatures
    const exclusionPatterns = [
      'ANUL',     // ANULADA, ANULADO...
      'CANC',     // CANCELADA...
      'VOID',
      'DEVU',     // Matches DEVUELTA, DEVUELTO
      'REEMB',    // Matches REEMBOLSO, REEMBOLSADA
      'ERROR',
      'FAIL',
      'RECHAZ'
    ];

    // If it contains any bad pattern, exclude it
    if (exclusionPatterns.some(p => s.includes(p))) {
      ignoredCount++;
      return false;
    }

    // 3. DEDUPLICATION: Avoid double-counting if the file has same line-items or duplicate rows
    // Signature: Date + Time + Value + Agent + Sucursal
    const signature = `${r.fecha}|${r.hora}|${r.valor}|${r.agentName}|${r.sucursal}`;
    if (uniqueMap.has(signature)) {
      duplicateCount++;
      return false;
    }
    uniqueMap.set(signature, true);

    return true;
  });

  // Filtering logic optimized for robustness (Test Suite: parser.service.test.ts)
  return {
    clean: cleanTransactions,
    raw: allTransactions,
    stats: {
      ignored: ignoredCount,
      duplicates: duplicateCount
    }
  };
}
