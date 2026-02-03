import { DateRangeValidationService } from '../DateRangeValidationService';

describe('DateRangeValidationService', () => {
    it('valida rangos idénticos', () => {
        const result = DateRangeValidationService.validate({
            answered: ['2024-01-01', '2024-01-02'],
            abandoned: ['2024-01-01', '2024-01-02'],
            transactions: ['2024-01-01', '2024-01-02'],
        });

        expect(result.valid).toBe(true);
        expect(result.range).toEqual({ from: '2024-01-01', to: '2024-01-02' });
    });

    it('rechaza rangos distintos', () => {
        const result = DateRangeValidationService.validate({
            answered: ['2024-01-01'],
            abandoned: ['2024-01-02'],
            transactions: ['2024-01-01'],
        });

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rechaza cuando un archivo no tiene fechas', () => {
        const result = DateRangeValidationService.validate({
            answered: [],
            abandoned: ['2024-01-01'],
            transactions: ['2024-01-01'],
        });

        expect(result.valid).toBe(false);
    });

    it('tolera fechas desordenadas y duplicadas', () => {
        const result = DateRangeValidationService.validate({
            answered: ['2024-01-03', '2024-01-01', '2024-01-01'],
            abandoned: ['2024-01-01', '2024-01-03'],
            transactions: ['2024-01-02', '2024-01-01', '2024-01-03'],
        });

        expect(result.valid).toBe(true);
        expect(result.range).toEqual({ from: '2024-01-01', to: '2024-01-03' });
    });
});
