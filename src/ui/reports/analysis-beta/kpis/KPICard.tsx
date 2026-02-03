'use client';

import { Card, CardContent } from "@/ui/reports/analysis-beta/ui/card";

type Props = {
    title: string;
    value: number | string;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: string;
    highlight?: boolean;
};

export default function KPICard({ title, value, subValue, color = "text-foreground", highlight }: Props) {
    return (
        <Card className={highlight ? "border-primary/50 bg-primary/5" : ""}>
            <CardContent className="p-4 flex flex-col items-start justify-center text-left">
                <p className="text-xs text-muted-foreground mb-1">{title}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
            </CardContent>
        </Card>
    );
}
