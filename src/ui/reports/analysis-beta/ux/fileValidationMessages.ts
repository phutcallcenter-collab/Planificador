import { FileNameValidationError } from '@/domain/call-center-analysis/services/FileNameValidationService';

export function buildFileNameErrorMessage(
    errors: FileNameValidationError[]
): string {
    return errors.map(e => {
        switch (e.role) {
            case 'ANSWERED':
                return `El archivo de LLAMADAS CONTESTADAS no es correcto.
Se esperaba algo como: ${e.expected}
Recibido: ${e.received}`;

            case 'ABANDONED':
                return `El archivo de LLAMADAS ABANDONADAS no es correcto.
Se esperaba algo como: ${e.expected}
Recibido: ${e.received}`;

            case 'TRANSACTIONS':
                return `El archivo de TRANSACCIONES no es correcto.
Se esperaba algo como: ${e.expected}
Recibido: ${e.received}`;
        }
    }).join('\n\n');
}
