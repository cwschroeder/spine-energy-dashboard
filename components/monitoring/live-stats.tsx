'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  TrendingUp, 
  TrendingDown,
  Signal,
  Network,
  Clock
} from 'lucide-react';
import type { Device } from '@/lib/api/types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface LiveStatsProps {
  devices: Device[];
  isLoading: boolean;
}

export function LiveStats({ devices, isLoading }: LiveStatsProps) {
  const getStatusCounts = () => {
    return devices.reduce((acc, device) => {
      acc[device.signal] = (acc[device.signal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const getNetworkDistribution = () => {
    const networks: Record<string, number> = {};
    devices.forEach(device => {
      if (device.report?.network) {
        const networkName = Array.isArray(device.report.network)
          ? device.report.network[0]?.name
          : device.report.network.name;
        if (networkName) {
          networks[networkName] = (networks[networkName] || 0) + 1;
        }
      }
    });
    return networks;
  };

  const getAverageSignalStrength = () => {
    const devicesWithSignal = devices.filter(d => d.report?.signalStrength);
    if (devicesWithSignal.length === 0) return 0;
    
    const sum = devicesWithSignal.reduce((acc, d) => acc + Math.abs(d.report!.signalStrength), 0);
    return Math.round(sum / devicesWithSignal.length);
  };

  const getRecentlyUpdated = () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    return devices.filter(d => {
      if (!d.lastOnline) return false;
      return new Date(d.lastOnline) > fiveMinutesAgo;
    }).length;
  };

  const statusCounts = getStatusCounts();
  const networkDist = getNetworkDistribution();
  const avgSignal = getAverageSignalStrength();
  const recentlyUpdated = getRecentlyUpdated();
  const totalDevices = devices.length;
  const onlineDevices = (statusCounts.green || 0) + (statusCounts.yellow || 0) + (statusCounts.red || 0);
  const onlinePercentage = totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlinePercentage.toFixed(1)}%</div>
            <Progress value={onlinePercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {onlineDevices} von {totalDevices} Geräten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ø Signalstärke</CardTitle>
            <Signal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-{avgSignal} dBm</div>
            <div className="flex items-center mt-2">
              {avgSignal < 85 ? (
                <Badge variant="default" className="bg-green-500">Gut</Badge>
              ) : avgSignal < 100 ? (
                <Badge variant="default" className="bg-yellow-500">Mittel</Badge>
              ) : (
                <Badge variant="default" className="bg-red-500">Schwach</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kürzlich aktualisiert</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentlyUpdated}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Letzte 5 Minuten
            </p>
            {recentlyUpdated > 0 && (
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">Aktiv</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Netzwerke</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(networkDist).map(([network, count]) => (
                <div key={network} className="flex items-center justify-between">
                  <span className="text-xs">{network}</span>
                  <Badge variant="outline" className="text-xs">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Signal-Verteilung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <Wifi className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Sehr gut</span>
                </div>
                <span className="text-sm font-medium">{statusCounts.green || 0}</span>
              </div>
              <Progress 
                value={(statusCounts.green || 0) / totalDevices * 100} 
                className="h-2 bg-green-100"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <Wifi className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm">Gut</span>
                </div>
                <span className="text-sm font-medium">{statusCounts.yellow || 0}</span>
              </div>
              <Progress 
                value={(statusCounts.yellow || 0) / totalDevices * 100} 
                className="h-2 bg-yellow-100"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <Wifi className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-sm">Schwach</span>
                </div>
                <span className="text-sm font-medium">{statusCounts.red || 0}</span>
              </div>
              <Progress 
                value={(statusCounts.red || 0) / totalDevices * 100} 
                className="h-2 bg-red-100"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <WifiOff className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">Offline</span>
                </div>
                <span className="text-sm font-medium">{statusCounts.grey || 0}</span>
              </div>
              <Progress 
                value={(statusCounts.grey || 0) / totalDevices * 100} 
                className="h-2 bg-gray-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}