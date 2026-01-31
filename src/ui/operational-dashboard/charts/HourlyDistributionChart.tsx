'use client';

import { useDashboardStore } from '@/store/useOperationalDashboardStore';
import { Bar } from 'react-chartjs-2';
import { aggregateByTimeSlot } from '@/domain/operational/kpi.service';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PillButton, PillToggleContainer } from '../ui/pills';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function HourlyDistributionChart() {
  const {
    answeredCalls,
    abandonedCalls,
    transactions,
    hourlyChartShift,
    setHourlyChartShift,
  } = useDashboardStore();

  const timeSlotData = aggregateByTimeSlot(
    answeredCalls,
    abandonedCalls,
    transactions
  );
  const chartDetails =
    hourlyChartShift === 'Dí­a' ? timeSlotData.day : timeSlotData.night;

  const data = {
    labels: chartDetails.map((s) => s.hora),
    datasets: [
      {
        label: 'Recibidas',
        data: chartDetails.map((s) => s.recibidas),
        backgroundColor: 'hsl(var(--primary) / 0.7)',
      },
      {
        label: 'Contestadas',
        data: chartDetails.map((s) => s.contestadas),
        backgroundColor: 'hsl(var(--primary) / 0.5)',
      },
      {
        label: 'Abandonadas',
        data: chartDetails.map((s) => s.abandonadas),
        backgroundColor: 'hsl(var(--destructive) / 0.7)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: { display: false },
      },
      y: {
        stacked: false,
        beginAtZero: true,
      },
    },
  };

  if (answeredCalls.length === 0 && abandonedCalls.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle>Distribución de llamadas por hora</CardTitle>
          <PillToggleContainer>
            <PillButton
              onClick={() => setHourlyChartShift('Día')}
              isActive={hourlyChartShift === 'Dí­a'}
            >
              Dí­a
            </PillButton>
            <PillButton
              onClick={() => setHourlyChartShift('Noche')}
              isActive={hourlyChartShift === 'Noche'}
            >
              Noche
            </PillButton>
          </PillToggleContainer>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <Bar options={options} data={data} />
        </div>
      </CardContent>
    </Card>
  );
}
