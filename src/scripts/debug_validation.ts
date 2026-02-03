
// Mock local imports since we're running with ts-node in a weird context maybe?
// Actually simpler: just copy the service code here to test it in isolation perfectly.

type FileKind = 'ANSWERED_CALLS' | 'ABANDONED_CALLS' | 'TRANSACTIONS';

interface FileSignature {
    kind: FileKind;
    requiredColumns: (string | string[])[];
    forbiddenColumns?: string[];
}

const FILE_SIGNATURES: FileSignature[] = [
    {
        kind: 'ANSWERED_CALLS',
        requiredColumns: [
            ['FECHA', 'DATE', 'DIA'],
            ['HORA', 'TIME', 'TIEMPO'],
            ['LLAMADAS', 'CALLS', 'COUNT', 'CANTIDAD'],
            ['CONEXION', 'CONECCION', 'DURACION', 'DURATION']
        ],
        forbiddenColumns: ['PLATAFORMA', 'CANAL', 'VALOR', 'MONTO', 'TOTAL'],
    },
    {
        kind: 'ABANDONED_CALLS',
        requiredColumns: [
            ['FECHA', 'DATE', 'DIA'],
            ['HORA', 'TIME', 'TIEMPO'],
            ['CONEXION', 'CONECCION', 'DURACION', 'DURATION']
        ],
        forbiddenColumns: ['LLAMADAS', 'CALLS', 'COUNT', 'CANTIDAD', 'PLATAFORMA', 'CANAL', 'VALOR', 'MONTO', 'TOTAL'],
    },
    {
        kind: 'TRANSACTIONS',
        requiredColumns: [
            ['FECHA', 'DATE', 'DIA', 'FECHA_COMPRA', 'CREATED_AT'],
            ['HORA', 'TIME', 'TIEMPO', 'CREATED_TIME'],
            ['PLATAFORMA', 'CANAL'],
            ['VALOR', 'MONTO', 'TOTAL']
        ],
        forbiddenColumns: ['LLAMADAS', 'CALLS', 'COUNT', 'CANTIDAD', 'CONEXION', 'CONECCION', 'DURACION', 'DURATION'],
    },
];

function normalizeHeaders(headers: string[]): string[] {
    return headers
        .map(h => h.trim().toUpperCase())
        .filter(Boolean);
}

function matchesSignature(
    headers: string[],
    signature: FileSignature
): boolean {
    const hasAllRequired = signature.requiredColumns.every(reqCol => {
        if (Array.isArray(reqCol)) {
            return reqCol.some(alias => headers.includes(alias));
        }
        return headers.includes(reqCol);
    });

    if (!hasAllRequired) return false;

    if (signature.forbiddenColumns) {
        const hasForbidden = signature.forbiddenColumns.some(col =>
            headers.includes(col)
        );
        if (hasForbidden) return false;
    }

    return true;
}

const FileValidationService = {
    validate(headers: string[]) {
        const normalizedHeaders = normalizeHeaders(headers);
        console.log('Testing Headers:', normalizedHeaders);
        const matches = FILE_SIGNATURES.filter(signature =>
            matchesSignature(normalizedHeaders, signature)
        );

        console.log('Matches found:', matches.map(m => m.kind));

        if (matches.length === 0) return { valid: false, reason: 'No match' };
        if (matches.length > 1) return { valid: false, reason: 'Ambiguous' };
        return { valid: true, detectedKind: matches[0].kind };
    }
};

// --- RUN TESTS ---

console.log("--- TEST 1: Answered with Aliases ---");
const t1 = ['FECHA', 'TIEMPO', 'COUNT', 'DURATION']; // Answered
console.log(FileValidationService.validate(t1));

console.log("\n--- TEST 2: Invalid Abandoned (Forbidden LLAMADAS) ---");
const t2 = ['FECHA', 'HORA', 'CONEXION', 'LLAMADAS']; // Should be rejected by Abandoned
// Also rejected by Answered (missing nothing? wait. Answered needs Llamadas. This has Llamadas.)
// Is LLAMADAS forbidden in Answered? No.
// Is LLAMADAS forbidden in Transactions? Yes.
// So this MATCHES Answered.
console.log(FileValidationService.validate(t2));

console.log("\n--- TEST 3: Mixed Invalid ---");
const t3 = ['FECHA', 'HORA', 'CONEXION', 'LLAMADAS', 'VALOR'];
console.log(FileValidationService.validate(t3));
