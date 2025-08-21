'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDevices } from '@/hooks/use-devices';
import { EnhancedLiveStatsOptimized } from '@/components/monitoring/enhanced-live-stats-optimized';
import { StatisticsCharts } from '@/components/monitoring/statistics-charts';
import { 
  Cpu, 
  Activity, 
  ArrowRight,
  TrendingUp,
  Map,
  BarChart3,
  Clock,
  Network
} from 'lucide-react';
import { SignalIndicator } from '@/components/devices/signal-indicator';
import dynamic from 'next/dynamic';

// Dynamically import map to avoid SSR issues
const DynamicLeafletMap = dynamic(
  () => import('@/components/monitoring/leaflet-map-optimized').then(mod => mod.LeafletMapOptimized),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-muted/20 rounded-lg">
        <p className="text-sm text-muted-foreground">Karte wird geladen...</p>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const router = useRouter();
  // Token is always available now (either custom or default)
  const { data, isLoading } = useDevices(1, 100);

  const getStatusCounts = () => {
    if (!data?.devices) return { green: 0, yellow: 0, red: 0, grey: 0 };
    
    return data.devices.reduce((acc, device) => {
      acc[device.signal] = (acc[device.signal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();
  const totalDevices = parseInt(data?.total || '0');
  const onlineDevices = (statusCounts.green || 0) + (statusCounts.yellow || 0) + (statusCounts.red || 0);
  // const offlineDevices = statusCounts.grey || 0;
  // const onlinePercentage = totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Übersicht über Ihre Smart Meter Gateway Infrastruktur
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/monitoring')}>
            <Activity className="h-4 w-4 mr-2" />
            Live Monitoring
          </Button>
          <Button variant="outline" onClick={() => router.push('/devices')}>
            <Cpu className="h-4 w-4 mr-2" />
            Alle Geräte
          </Button>
        </div>
      </div>

      {/* Live Stats Overview */}
      <EnhancedLiveStatsOptimized devices={data?.devices || []} isLoading={isLoading} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="map">
            <Map className="h-4 w-4 mr-2" />
            Karte
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistiken
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Devices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Neueste Geräte
                </CardTitle>
                <CardDescription>Zuletzt aktualisierte Smart Meter Gateways</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data?.devices
                      .sort((a, b) => {
                        const dateA = new Date(a.lastOnline || 0).getTime();
                        const dateB = new Date(b.lastOnline || 0).getTime();
                        return dateB - dateA;
                      })
                      .slice(0, 6)
                      .map((device) => {
                        const lastOnline = device.lastOnline ? new Date(device.lastOnline) : null;
                        const minutesAgo = lastOnline 
                          ? Math.floor((Date.now() - lastOnline.getTime()) / 60000)
                          : null;
                        
                        return (
                          <div
                            key={device.device_id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/devices/${device.device_id}`)}
                          >
                            <div className="flex items-center space-x-3">
                              <SignalIndicator signal={device.signal} />
                              <div>
                                <p className="text-sm font-medium">{device.device_id}</p>
                                {device.alias && (
                                  <p className="text-xs text-muted-foreground">{device.alias}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {minutesAgo !== null && (
                                <span className="text-xs text-muted-foreground">
                                  {minutesAgo === 0 ? 'Jetzt' : 
                                   minutesAgo < 60 ? `vor ${minutesAgo}m` :
                                   minutesAgo < 1440 ? `vor ${Math.floor(minutesAgo / 60)}h` :
                                   `vor ${Math.floor(minutesAgo / 1440)}d`}
                                </span>
                              )}
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
                <Button
                  className="w-full mt-4"
                  variant="outline"
                  onClick={() => router.push('/devices')}
                >
                  Alle Geräte anzeigen
                </Button>
              </CardContent>
            </Card>

            {/* Network Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-green-500" />
                  Netzwerk-Übersicht
                </CardTitle>
                <CardDescription>Verteilung und Status der Netzwerke</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {data?.devices && (() => {
                    const networks: Record<string, { count: number; online: number }> = {};
                    
                    data.devices.forEach(device => {
                      if (device.report?.network) {
                        const networkName = Array.isArray(device.report.network)
                          ? device.report.network[0]?.name
                          : device.report.network.name;
                        
                        if (networkName) {
                          if (!networks[networkName]) {
                            networks[networkName] = { count: 0, online: 0 };
                          }
                          networks[networkName].count++;
                          if (device.signal !== 'grey') {
                            networks[networkName].online++;
                          }
                        }
                      }
                    });

                    return Object.entries(networks)
                      .sort((a, b) => b[1].count - a[1].count)
                      .slice(0, 5)
                      .map(([network, stats]) => (
                        <div key={network} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{network}</span>
                              <span className="text-xs text-muted-foreground">
                                ({stats.online}/{stats.count} online)
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {((stats.online / stats.count) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-400"
                              style={{ width: `${(stats.online / stats.count) * 100}%` }}
                            />
                          </div>
                        </div>
                      ));
                  })()}
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Durchschn. Signal</p>
                      <p className="text-lg font-semibold">
                        {data?.devices && (() => {
                          const signals = data.devices
                            .filter(d => d.report?.signalStrength)
                            .map(d => d.report!.signalStrength);
                          
                          if (signals.length === 0) return 'N/A';
                          const avg = signals.reduce((a, b) => a + b, 0) / signals.length;
                          return `${avg.toFixed(0)} dBm`;
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Aktive Netzwerke</p>
                      <p className="text-lg font-semibold">
                        {data?.devices && (() => {
                          const uniqueNetworks = new Set();
                          data.devices.forEach(device => {
                            if (device.report?.network) {
                              const networkName = Array.isArray(device.report.network)
                                ? device.report.network[0]?.name
                                : device.report.network.name;
                              if (networkName) uniqueNetworks.add(networkName);
                            }
                          });
                          return uniqueNetworks.size;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Aktuelle Systemstatistiken und Verbindungsstatus</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                  <div>
                    <p className="text-xs text-green-700">API-Verbindung</p>
                    <p className="text-sm font-semibold text-green-800">Aktiv</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div>
                    <p className="text-xs text-blue-700">Update-Intervall</p>
                    <p className="text-sm font-semibold text-blue-800">60 Sek.</p>
                  </div>
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <div>
                    <p className="text-xs text-purple-700">Cache-Einträge</p>
                    <p className="text-sm font-semibold text-purple-800">Aktiv</p>
                  </div>
                  <Activity className="h-5 w-5 text-purple-500" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div>
                    <p className="text-xs text-orange-700">Letztes Update</p>
                    <p className="text-sm font-semibold text-orange-800">Live</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle>Geräte-Standorte</CardTitle>
              <CardDescription>
                Geografische Verteilung der Smart Meter Gateways
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px] p-0">
              {data?.devices && <DynamicLeafletMap devices={data.devices} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <StatisticsCharts devices={data?.devices || []} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}