import type {
  AnsweredCall,
  AbandonedCall,
  Transaction,
} from '@/domain/operational/dashboard.types';

export const demoAnsweredCalls: Omit<AnsweredCall, 'id' | 'turno'>[] = [
  {
    dst: '809',
    fecha: '2025-09-16',
    periodo: '09:00-09:29',
    hora: '09:15:00',
    llamadas: 15,
    conexion: 180,
  },
  {
    dst: '809',
    fecha: '2025-09-16',
    periodo: '10:30-10:59',
    hora: '10:45:00',
    llamadas: 45,
    conexion: 240,
  },
  {
    dst: '809',
    fecha: '2025-09-16',
    periodo: '16:00-16:29',
    hora: '16:15:00',
    llamadas: 34,
    conexion: 220,
  },
];

export const demoAbandonedCalls: Omit<
  AbandonedCall,
  'id' | 'turno' | 'periodo'
>[] = [
    {
      telefono: '8291234567',
      fecha: '2025-09-16',
      hora: '11:05:00',
      conexion: 45,
      disposition: 'ABANDON',
    },
    {
      telefono: '8297654321',
      fecha: '2025-09-16',
      hora: '16:30:00',
      conexion: 50,
      disposition: 'ABANDON',
    },
    {
      telefono: '8293456789',
      fecha: '2025-09-16',
      hora: '20:15:00',
      conexion: 35,
      disposition: 'ABANDON',
    },
    {
      telefono: '8291112222',
      fecha: '2025-09-16',
      hora: '09:10:00',
      conexion: 15,
      disposition: 'ABANDON',
    }, // LT20
    {
      telefono: '8293334444',
      fecha: '2025-09-16',
      hora: '09:20:00',
      conexion: 30,
      disposition: 'ABANDON',
    }, // Duplicate
    {
      telefono: '8293334444',
      fecha: '2025-09-16',
      hora: '09:22:00',
      conexion: 32,
      disposition: 'ABANDON',
    }, // Duplicate
  ];

export const demoTransactions: Omit<Transaction, 'id'>[] = [
  {
    plataforma: 'Call Center',
    plataformaCode: 'CC',
    sucursal: 'Sucursal Centro',
    canalReal: 'Delivery',
    fecha: '2025-09-16',
    hora: '11:18:00',
    estatus: 'N',
    valor: 1250,
  },
  {
    plataforma: 'Call Center',
    plataformaCode: 'CC',
    sucursal: 'Sucursal Norte',
    canalReal: 'Carryout',
    fecha: '2025-09-16',
    hora: '16:10:00',
    estatus: 'N',
    valor: 980,
  },
  {
    plataforma: 'App',
    plataformaCode: 'APP',
    sucursal: 'Sucursal Sur',
    canalReal: 'Carryout',
    fecha: '2025-09-16',
    hora: '19:40:00',
    estatus: 'N',
    valor: 750,
  },
  {
    plataforma: 'Web',
    plataformaCode: 'WEB',
    sucursal: 'Sucursal Este',
    canalReal: 'Delivery',
    fecha: '2025-09-16',
    hora: '10:40:00',
    estatus: 'A',
    valor: 650,
  },
  {
    plataforma: 'Call Center',
    plataformaCode: 'CC',
    sucursal: 'Sucursal Centro',
    canalReal: 'Delivery',
    fecha: '2025-09-16',
    hora: '11:25:00',
    estatus: 'A', // Annulled
    valor: 300,
  },
];
