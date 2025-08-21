'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { EnhancedLiveStatsOptimized } from '@/components/monitoring/enhanced-live-stats-optimized';
import { StatisticsCharts } from '@/components/monitoring/statistics-charts';
import { SNRQualityWidget } from '@/components/monitoring/snr-quality-widget';
import { SuccessRateDashboard } from '@/components/monitoring/success-rate-dashboard';
import { ServiceHealthWidget } from '@/components/monitoring/service-health-widget';
import { NetworkAnalysisDashboard } from '@/components/monitoring/network-analysis-dashboard';
import { useDevices, useInvalidateCache } from '@/hooks/use-devices';
import { RefreshCw, Map, BarChart3, Activity, Clock, Wifi, WifiOff, Network, Server } from 'lucide-react';
import { CacheIndicator } from '@/components/ui/cache-indicator';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

import dynamic from 'next/dynamic';

const DynamicLeafletMap = dynamic(
  () => import('@/components/monitoring/leaflet-map-optimized').then(mod => ({ 
    default: mod.LeafletMapOptimized 
  })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-sm text-muted-foreground">Karte wird geladen...</p>
      </div>
    ),
  }
);

export default function EnhancedMonitoringPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { data, isLoading, refetch } = useDevices(1, 100);
  const { invalidateDeviceList } = useInvalidateCache();

  const handleRefresh = () => {
    invalidateDeviceList();
    refetch();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Erweitertes Live-Monitoring</h1>
          <p className="text-muted-foreground">
            Umfassende Überwachung mit erweiterten Netzwerk-Metriken
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <CacheIndicator />
          <div className="flex items-center space-x-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Auto-Refresh: An" : "Auto-Refresh: Aus"}
            </Button>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="network">
            <Network className="h-4 w-4 mr-2" />
            Netzwerk
          </TabsTrigger>
          <TabsTrigger value="map">
            <Map className="h-4 w-4 mr-2" />
            Karte
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistiken
          </TabsTrigger>
          <TabsTrigger value="health">
            <Server className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SNRQualityWidget devices={data?.devices || []} isLoading={isLoading} />
            <div className="md:col-span-2">
              <SuccessRateDashboard devices={data?.devices || []} isLoading={isLoading} />
            </div>
          </div>

          {/* Live Stats */}
          <EnhancedLiveStatsOptimized devices={data?.devices || []} isLoading={isLoading} />
          
          {/* Recent Activities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Letzte Aktivitäten
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoading ? (
                <div className="space-y-1">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {data?.devices
                    .filter(d => d.lastOnline)
                    .sort((a, b) => {
                      const dateA = new Date(a.lastOnline || 0).getTime();
                      const dateB = new Date(b.lastOnline || 0).getTime();
                      return dateB - dateA;
                    })
                    .slice(0, 8)
                    .map((device, index) => {
                      const lastOnlineDate = new Date(device.lastOnline!);
                      const now = new Date();
                      const diffMinutes = Math.floor((now.getTime() - lastOnlineDate.getTime()) / (1000 * 60));
                      
                      const getTimeAgo = () => {
                        if (diffMinutes < 1) return 'Gerade eben';
                        if (diffMinutes < 60) return `vor ${diffMinutes} Min.`;
                        const hours = Math.floor(diffMinutes / 60);
                        if (hours < 24) return `vor ${hours} Std.`;
                        const days = Math.floor(hours / 24);
                        return `vor ${days} Tag${days !== 1 ? 'en' : ''}`;
                      };

                      const statusColor = {
                        green: 'bg-green-500',
                        yellow: 'bg-yellow-500',
                        red: 'bg-red-500',
                        grey: 'bg-gray-400'
                      }[device.signal] || 'bg-gray-400';

                      const statusIcon = device.signal === 'grey' ? 
                        <WifiOff className="w-3 h-3 text-gray-400" /> : 
                        <Wifi className="w-3 h-3 text-green-500" />;

                      return (
                        <motion.div
                          key={device.device_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="flex items-center gap-3 py-2 px-3 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className={`w-2 h-2 rounded-full ${statusColor} flex-shrink-0`} />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{device.device_id}</span>
                                {device.alias && (
                                  <span className="text-xs text-muted-foreground truncate">• {device.alias}</span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {getTimeAgo()}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              {device.report?.signalStrength && (
                                <span className="text-xs text-muted-foreground">
                                  Signal: {device.report.signalStrength} dBm
                                </span>
                              )}
                              {device.report?.snr !== undefined && (
                                <span className="text-xs text-muted-foreground">
                                  SNR: {device.report.snr} dB
                                </span>
                              )}
                              {device.report?.percentSuccess !== undefined && (
                                <span className="text-xs text-muted-foreground">
                                  Erfolg: {device.report.percentSuccess}%
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {statusIcon}
                            {diffMinutes <= 5 && (
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <NetworkAnalysisDashboard devices={data?.devices || []} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="map" className="h-full flex flex-col">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="flex-shrink-0 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5 text-blue-500" />
                    Geräte-Standorte
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Geografische Verteilung mit Netzwerk-Metriken
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Online</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Warnung</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Kritisch</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>Offline</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 p-0">
              <div className="flex-1 rounded-b-lg overflow-hidden" style={{ minHeight: 'calc(100vh - 280px)' }}>
                {data?.devices && <DynamicLeafletMap devices={data.devices} />}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <StatisticsCharts devices={data?.devices || []} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ServiceHealthWidget />
            
            {/* System Metrics Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">System-Metriken</CardTitle>
                <CardDescription className="text-xs">Geräte-Verbindungsstatistiken</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Gesamt Geräte</span>
                    <span className="text-sm font-medium">{data?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Online</span>
                    <span className="text-sm font-medium text-green-600">
                      {data?.devices.filter(d => d.signal === 'green').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Warnung</span>
                    <span className="text-sm font-medium text-yellow-600">
                      {data?.devices.filter(d => d.signal === 'yellow').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Kritisch</span>
                    <span className="text-sm font-medium text-red-600">
                      {data?.devices.filter(d => d.signal === 'red').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Offline</span>
                    <span className="text-sm font-medium text-gray-600">
                      {data?.devices.filter(d => d.signal === 'grey').length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection Lifetime Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Verbindungs-Lebenszeit</CardTitle>
                <CardDescription className="text-xs">Durchschnittliche Verbindungsdauer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const devicesWithLifetime = data?.devices.filter(d => 
                      d.report?.lifetime !== undefined && d.report.lifetime !== null
                    ) || [];
                    
                    const avgLifetime = devicesWithLifetime.length > 0
                      ? devicesWithLifetime.reduce((acc, d) => acc + (d.report?.lifetime || 0), 0) / devicesWithLifetime.length
                      : 0;

                    const maxLifetime = devicesWithLifetime.length > 0
                      ? Math.max(...devicesWithLifetime.map(d => d.report?.lifetime || 0))
                      : 0;

                    const formatLifetime = (seconds: number) => {
                      const hours = Math.floor(seconds / 3600);
                      const minutes = Math.floor((seconds % 3600) / 60);
                      if (hours > 24) {
                        const days = Math.floor(hours / 24);
                        return `${days} Tag${days !== 1 ? 'e' : ''}, ${hours % 24} Std.`;
                      }
                      if (hours > 0) return `${hours} Std., ${minutes} Min.`;
                      return `${minutes} Min.`;
                    };

                    return (
                      <>
                        <div>
                          <p className="text-2xl font-bold">{formatLifetime(avgLifetime)}</p>
                          <p className="text-xs text-muted-foreground">Durchschnitt</p>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">Maximum</span>
                            <span className="text-xs font-medium">{formatLifetime(maxLifetime)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Geräte mit Daten</span>
                            <span className="text-xs font-medium">{devicesWithLifetime.length}</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}