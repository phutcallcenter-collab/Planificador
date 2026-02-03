
import { ActualOperationalLoadBuilder } from './ActualOperationalLoadBuilder';
import { AnsweredCall, AbandonedCall, Transaction } from '../dashboard.types';

describe('ActualOperationalLoadBuilder', () => {

    const mockAnswered = (date: string, time: string, calls: number, shift: 'Día' | 'Noche'): AnsweredCall => ({
        id: '1', dst: '1', fecha: date, hora: time, periodo: time,
        llamadas: calls, conexion: 10, turno: shift
    });

    const mockAbandoned = (date: string, time: string, shift: 'Día' | 'Noche'): AbandonedCall => ({
        id: '2', telefono: '1', fecha: date, hora: time, periodo: time,
        conexion: 5, turno: shift, disposition: 'ABANDONED'
    });

    const mockTransaction = (date: string, time: string): Transaction => ({
        id: '3', sucursal: '1', canalReal: 'WEB', plataforma: 'Call Center', plataformaCode: 'CC',
        fecha: date, hora: time, estatus: 'PAID', valor: 100
    });

    it('should aggregate simple answered and abandoned calls by shift', () => {
        const answered = [
            mockAnswered('2023-10-01', '09:00', 5, 'Día'),
            mockAnswered('2023-10-01', '10:00', 3, 'Día'),
            mockAnswered('2023-10-01', '20:00', 2, 'Noche')
        ];
        const abandoned = [
            mockAbandoned('2023-10-01', '09:30', 'Día')
        ];

        const result = ActualOperationalLoadBuilder.build(answered, abandoned, []);

        expect(result).toHaveLength(2);

        const day = result.find(r => r.shift === 'DAY');
        expect(day).toBeDefined();
        expect(day?.receivedCalls).toBe(5 + 3 + 1); // 8 answered + 1 abandoned
        expect(day?.answeredCalls).toBe(8);
        expect(day?.abandonedCalls).toBe(1);

        const night = result.find(r => r.shift === 'NIGHT');
        expect(night).toBeDefined();
        expect(night?.receivedCalls).toBe(2);
        expect(night?.answeredCalls).toBe(2);
    });

    it('should aggregate transactions and infer shift correctly', () => {
        const transactions = [
            mockTransaction('2023-10-01', '10:00'), // Day (09-16)
            mockTransaction('2023-10-01', '14:59'), // Day
            mockTransaction('2023-10-01', '19:00')  // Night (16-00)
        ];

        const result = ActualOperationalLoadBuilder.build([], [], transactions);

        expect(result).toHaveLength(2);

        const day = result.find(r => r.shift === 'DAY');
        expect(day?.transactions).toBe(2);

        const night = result.find(r => r.shift === 'NIGHT');
        expect(night?.transactions).toBe(1);
    });

    it('should mix all sources correctly', () => {
        const result = ActualOperationalLoadBuilder.build(
            [mockAnswered('2023-10-01', '09:00', 10, 'Día')],
            [mockAbandoned('2023-10-01', '09:05', 'Día')],
            [mockTransaction('2023-10-01', '09:10')]
        );

        expect(result).toHaveLength(1);
        expect(result[0].shift).toBe('DAY');
        expect(result[0].receivedCalls).toBe(11);
        expect(result[0].answeredCalls).toBe(10);
        expect(result[0].abandonedCalls).toBe(1);
        expect(result[0].transactions).toBe(1);
    });
});
