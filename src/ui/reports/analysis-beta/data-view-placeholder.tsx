import { Card, CardHeader, CardTitle, CardContent } from '@/ui/reports/analysis-beta/ui/card';
import { BarChart, LineChart } from 'lucide-react';

export function DataViewPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visualizaciones de Datos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/25 p-12 text-center h-[450px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background">
            <BarChart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Sin datos para mostrar</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Cargue archivos de datos para generar grÃ¡ficos y tablas de anÃ¡lisis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
