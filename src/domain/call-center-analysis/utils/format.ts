export function formatCurrency(value: number, decimals = 2): string {
    if (!isFinite(value)) return '$0.00';
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

export function formatNumber(value: number): string {
    if (!isFinite(value)) return '0';
    return new Intl.NumberFormat('es-DO').format(value);
}

export function formatPercent(value: number, decimals = 1): string {
    if (!isFinite(value)) return '0%';
    const formatted = new Intl.NumberFormat('es-DO', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
    return `${formatted}%`;
}
