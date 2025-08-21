'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import type { Device } from '@/lib/api/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ReconnectStatisticsProps {
  devices: Device[];
  isLoading?: boolean;
}

export function ReconnectStatistics({ devices, isLoading }: ReconnectStatisticsProps) {
  // Extract devices with reconnect data
  const devicesWithReconnects = devices.filter(d => 
    d.report?.reconnects !== undefined && d.report.reconnects !== null
  );

  // Calculate statistics
  const totalReconnects = devicesWithReconnects.reduce((acc, d) => 
    acc + (d.report?.reconnects || 0), 0
  );

  const avgReconnects = devicesWithReconnects.length > 0
    ? totalReconnects / devicesWithReconnects.length
    : 0;

  const maxReconnects = devicesWithReconnects.length > 0
    ? Math.max(...devicesWithReconnects.map(d => d.report?.reconnects || 0))
    : 0;

  // Create distribution data for chart
  const distributionData = [
    { range: '0', count: devicesWithReconnects.filter(d => (d.report?.reconnects || 0) === 0).length },
    { range: '1-5', count: devicesWithReconnects.filter(d => (d.report?.reconnects || 0) > 0 && (d.report?.reconnects || 0) <= 5).length },
    { range: '6-10', count: devicesWithReconnects.filter(d => (d.report?.reconnects || 0) > 5 && (d.report?.reconnects || 0) <= 10).length },
    { range: '11-20', count: devicesWithReconnects.filter(d => (d.report?.reconnects || 0) > 10 && (d.report?.reconnects || 0) <= 20).length },
    { range: '>20', count: devicesWithReconnects.filter(d => (d.report?.reconnects || 0) > 20).length },
  ];

  // Find problematic devices (high reconnect count)
  const problematicDevices = devicesWithReconnects
    .filter(d => (d.report?.reconnects || 0) > 10)
    .sort((a, b) => (b.report?.reconnects || 0) - (a.report?.reconnects || 0))
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wiederverbindungs-Statistiken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (devicesWithReconnects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Wiederverbindungs-Statistiken
          </CardTitle>
          <CardDescription>Keine Wiederverbindungsdaten verfügbar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Derzeit sind keine Geräte mit Wiederverbindungsdaten verfügbar.
            </p>
            <p className="text-xs text-muted-foreground">
              Benötigtes Feld: reconnects
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Statistics Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Wiederverbindungs-Übersicht
            </CardTitle>
            <Badge variant={avgReconnects <= 5 ? 'default' : avgReconnects <= 10 ? 'secondary' : 'destructive'}>
              {avgReconnects <= 5 ? 'Stabil' : avgReconnects <= 10 ? 'Mäßig' : 'Instabil'}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Netzwerk-Stabilitätsanalyse basierend auf Wiederverbindungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Gesamt</p>
              <p className="text-2xl font-bold">{totalReconnects}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Durchschnitt</p>
              <p className="text-2xl font-bold">{avgReconnects.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Maximum</p>
              <p className="text-2xl font-bold">{maxReconnects}</p>
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="range" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(value) => `Wiederverbindungen: ${value}`}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="Geräte"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              {devicesWithReconnects.length} von {devices.length} Geräten mit Wiederverbindungsdaten
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Problematic Devices Card */}
      {problematicDevices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Geräte mit hohen Wiederverbindungen
            </CardTitle>
            <CardDescription className="text-xs">
              Geräte, die möglicherweise Aufmerksamkeit benötigen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {problematicDevices.map((device) => (
                <div 
                  key={device.device_id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{device.device_id}</p>
                    {device.alias && (
                      <p className="text-xs text-muted-foreground">{device.alias}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {device.report?.percentSuccess !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {device.report.percentSuccess}% Erfolg
                      </Badge>
                    )}
                    <Badge variant="destructive">
                      {device.report?.reconnects} Reconnects
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stability Trends Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Stabilitäts-Indikatoren</CardTitle>
          <CardDescription className="text-xs">
            Korrelation zwischen Wiederverbindungen und Erfolgsrate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Stabile Geräte (0 Reconnects)</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-lg font-bold">
                  {devicesWithReconnects.filter(d => (d.report?.reconnects || 0) === 0).length}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({((devicesWithReconnects.filter(d => (d.report?.reconnects || 0) === 0).length / devicesWithReconnects.length) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Instabile Geräte (&gt;10 Reconnects)</p>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-lg font-bold">
                  {devicesWithReconnects.filter(d => (d.report?.reconnects || 0) > 10).length}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({((devicesWithReconnects.filter(d => (d.report?.reconnects || 0) > 10).length / devicesWithReconnects.length) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Empfehlung:</strong> Geräte mit mehr als 10 Wiederverbindungen sollten auf 
              Netzwerkprobleme, Signalstärke oder Hardware-Defekte überprüft werden.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}