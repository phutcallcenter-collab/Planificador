export type AnsweredCall = {
  id: string;
  dst: string;
  fecha: string;
  periodo: string;
  hora: string;
  llamadas: number;
  conexion: number;
  turno: Shift | 'fuera';
};

export type AbandonedCall = {
  id: string;
  telefono: string;
  fecha: string;
  hora: string;
  conexion: number;
  periodo: string;
  turno: Shift | 'fuera';
  disposition: string;
  isDuplicate?: boolean;
  isLT20?: boolean;
};

export type Transaction = {
  id: string;
  sucursal: string;
  canalReal: string;
  plataforma: string;
  plataformaCode: string;
  fecha: string;
  hora: string;
  periodo: string;
  estatus: string;
  valor: number;
  agentName?: string; // Captures 'registro' column for provisional tracking
};

export type KPIs = {
  recibidas: number;
  contestadas: number;
  abandonadas: number;
  nivelDeServicio: number;
  conversion: number;
  transaccionesCC: number;
  abandonoPct: number;
};

export type Shift = 'Día' | 'Noche';

export type ShiftKPIs = {
  recibidas: number;
  contestadas: number;
  trans: number;
  conv: number;
  abandonadas: number;
  duplicadas: number;
  lt20: number;
  atencion: number;
  abandonoPct: number;
};

export type TimeSlotKpi = {
  hora: string;
  recibidas: number;
  contestadas: number;
  conexionSum: number;
  conexionAvg: number;
  pctAtencion: number;
  abandonadas: number;
  abandConnSum: number;
  abandAvg: number;
  pctAband: number;
  conversionRate: number;
};
