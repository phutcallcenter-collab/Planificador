
import { processTransactions, processAnsweredCalls, processAbandonedCalls } from './parser.service';

describe('Parser Service Resilience', () => {

    describe('processTransactions', () => {
        it('should handle "A" and "N" status as VALID (Active/Normal)', () => {
            const raw = [
                { id: 1, estatus: 'A', valor: 100, sucursal: 'Test' },
                { id: 2, estatus: 'N', valor: 200, sucursal: 'Test' },
                { id: 3, estatus: 'ANULADA', valor: 300, sucursal: 'Test' }
            ];
            const { clean, raw: resultRaw } = processTransactions(raw as any);

            expect(clean.length).toBe(2);
            expect(clean.find(t => t.items?.some(i => i.valor === 100))).toBeUndefined(); // Wait, the type is Transaction not aggregator.
            // Adjusting expectation for Transaction type
            expect(clean.filter(t => t.valor === 100)).toHaveLength(1);
            expect(clean.filter(t => t.valor === 200)).toHaveLength(1);
        });

        it('should filter out explict invalid statuses', () => {
            const raw = [
                { estatus: 'ANULADA' },
                { estatus: 'CANCELADA' },
                { estatus: 'VOID' },
                { estatus: 'DEVUELTA' },
                { estatus: 'COMPLETADA' } // Valid
            ];
            const { clean } = processTransactions(raw as any);
            expect(clean.length).toBe(1);
            expect(clean[0].estatus).toBe('COMPLETADA');
        });

        it('should map various synonyms for VALUE', () => {
            const raw = [
                { estatus: 'OK', monto: 100 },
                { estatus: 'OK', precio: 50 },
                { estatus: 'OK', total: 75.5 },
                { estatus: 'OK', importe: 25 },
                { estatus: 'OK', payment: 0 } // invalid key
            ];
            const { clean } = processTransactions(raw as any);
            // Check that values are extracted
            expect(clean[0].valor).toBe(100);
            expect(clean[1].valor).toBe(50);
            expect(clean[2].valor).toBe(75.5);
            expect(clean[3].valor).toBe(25);
            expect(clean[4].valor).toBe(0);
        });

        it('should map various synonyms for STATUS', () => {
            const raw = [
                { state: 'OK', monto: 10 },
                { situacion: 'OK', monto: 10 },
                { status: 'OK', monto: 10 },
            ];
            const { clean } = processTransactions(raw as any);
            expect(clean).toHaveLength(3);
            clean.forEach(c => expect(c.estatus).toBe('OK'));
        });
    });
});
