export type FileRole = 'ANSWERED' | 'ABANDONED' | 'TRANSACTIONS';

export interface FileNameValidationError {
    role: FileRole;
    expected: string;
    received: string;
}

export const FileNameValidationService = {
    validate(
        files: Partial<Record<FileRole, File>>
    ): FileNameValidationError[] {
        const rules: Record<FileRole, string> = {
            ANSWERED: 'llamadas_x_fecha_periodo',
            ABANDONED: 'llamadas_abandonadas',
            TRANSACTIONS: 'EXPORT_TRS',
        };

        const errors: FileNameValidationError[] = [];

        (Object.keys(rules) as FileRole[]).forEach(role => {
            const file = files[role];
            if (!file) return;

            const name = file.name.toUpperCase();
            const expected = rules[role].toUpperCase();

            if (!name.includes(expected)) {
                errors.push({
                    role,
                    expected: rules[role],
                    received: file.name,
                });
            }
        });

        return errors;
    },
};
