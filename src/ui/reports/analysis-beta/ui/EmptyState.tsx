'use client';

import { FileSpreadsheet } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: React.ElementType;
}

export function EmptyState({
    title,
    description,
    icon: Icon = FileSpreadsheet,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg border-muted-foreground/25 bg-muted/50">
            <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-background border shadow-sm">
                <Icon className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="max-w-sm mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
    );
}
