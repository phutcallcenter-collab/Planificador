export function buildDateRangeErrorMessage(errors: string[]): string {
    return `
Los archivos no corresponden al mismo período.

${errors.join('\n')}

Verifica que los tres archivos hayan sido exportados
desde el sistema para el MISMO rango de fechas.
`.trim();
}
