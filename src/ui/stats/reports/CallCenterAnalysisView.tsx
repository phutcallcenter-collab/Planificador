'use client';

import React from 'react';
import { EmptyState } from '@/ui/reports/analysis-beta/ui/EmptyState';
import { useAgentPerformanceStore } from '@/store/useAgentPerformanceStore';
import { useOperationalDashboardStore, OperationalStore } from '@/store/useOperationalDashboardStore';
import { BarChart3, Upload } from 'lucide-react';
import KPISummary from '@/ui/reports/analysis-beta/kpis/KPISummary';
import FileLoadButtons from '@/ui/reports/analysis-beta/header/FileLoadButtons';
import { DateRangeDisplay } from '@/ui/reports/analysis-beta/header/DateRangeDisplay';
import ShiftGrid from '@/ui/reports/analysis-beta/shifts/ShiftGrid';
import KPIObserver from '@/ui/reports/analysis-beta/kpis/KPIObserver';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/ui/reports/analysis-beta/ui/tabs';
import ShiftTablesContainer from '@/ui/reports/analysis-beta/tables/ShiftTablesContainer';
import { Toaster } from '@/ui/reports/analysis-beta/ui/toaster';

import ShiftPerformanceChart from '@/ui/reports/analysis-beta/charts/ShiftPerformanceChart';
import HourlyDistributionChart from '@/ui/reports/analysis-beta/charts/HourlyDistributionChart';
import PlatformTransactionsChart from '@/ui/reports/analysis-beta/charts/PlatformTransactionsChart';
import PlatformSalesChart from '@/ui/reports/analysis-beta/charts/PlatformSalesChart';
import PlatformAovChart from '@/ui/reports/analysis-beta/charts/PlatformAovChart';
import TopBranchesChart from '@/ui/reports/analysis-beta/charts/TopBranchesChart';
import HourlyAbandonmentRateChart from '@/ui/reports/analysis-beta/charts/HourlyAbandonmentRateChart';
import HourlyConversionRateChart from '@/ui/reports/analysis-beta/charts/HourlyConversionRateChart';
import DailyVolumeChart from '@/ui/reports/analysis-beta/charts/DailyVolumeChart';
import CallCenterVolumeCards from '@/ui/reports/analysis-beta/stats/CallCenterVolumeCards';
import AuditView from '@/ui/reports/analysis-beta/audit/AuditView';
import { AgentPerformanceTable } from '@/ui/reports/analysis-beta/agents/AgentPerformanceTable';

export function CallCenterAnalysisView() {
    const { data } = useOperationalDashboardStore((state: OperationalStore) => ({
        data: state.data
    }));

    const hasData = data.answered && data.answered.length > 0;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Análisis Operativo de Llamadas
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Métricas básicas del call center
                            </p>
                        </div>
                        <FileLoadButtons />
                    </div>

                    <DateRangeDisplay />
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <Tabs defaultValue="dashboard" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
                        <TabsTrigger value="transacciones">Transacciones</TabsTrigger>
                    </TabsList>

                    {/* Dashboard Tab */}
                    <TabsContent value="dashboard">
                        {!hasData ? (
                            <EmptyState
                                title="No hay datos cargados"
                                description="Carga archivos de llamadas para ver el dashboard."
                                icon={Upload}
                            />
                        ) : (
                            <div className="space-y-6">
                                <KPISummary />
                                <KPIObserver />
                                <ShiftGrid />
                                <ShiftTablesContainer />
                            </div>
                        )}
                    </TabsContent>

                    {/* Estadísticas Tab */}
                    <TabsContent value="estadisticas">
                        {!hasData ? (
                            <EmptyState
                                title="Estadísticas no disponibles"
                                description="Se requieren datos cargados para ver estadísticas."
                                icon={BarChart3}
                            />
                        ) : (
                            <div className="space-y-8">
                                {/* Call Center Metrics */}
                                <div>
                                    <h2 className="text-2xl font-bold mb-6 text-gray-800">
                                        📞 Call Center
                                    </h2>
                                    <div className="space-y-6">
                                        <CallCenterVolumeCards />
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <DailyVolumeChart />
                                            <ShiftPerformanceChart />
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <HourlyDistributionChart />
                                            <HourlyAbandonmentRateChart />
                                        </div>
                                        <HourlyConversionRateChart />
                                    </div>
                                </div>

                                {/* Digital Platforms */}
                                <div>
                                    <h2 className="text-2xl font-bold mb-6 text-gray-800">
                                        💻 Plataformas Digitales
                                    </h2>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <PlatformTransactionsChart />
                                        <PlatformSalesChart />
                                    </div>
                                    <div className="mt-6">
                                        <PlatformAovChart />
                                    </div>
                                </div>

                                {/* Branches */}
                                <div>
                                    <h2 className="text-2xl font-bold mb-6 text-gray-800">
                                        🏢 Sucursales
                                    </h2>
                                    <TopBranchesChart />
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Transacciones Tab */}
                    <TabsContent value="transacciones">
                        <div className="space-y-8">
                            {/* Tabla de Rendimiento por Agente - Siempre visible */}
                            <AgentPerformanceTable />
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Audit View */}
                <div className="mt-8">
                    <AuditView />
                </div>
            </div>

            <Toaster />
        </div>
    );
}
