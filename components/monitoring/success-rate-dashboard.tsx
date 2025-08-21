'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Device } from '@/lib/api/types';

interface SuccessRateDashboardProps {
  devices: Device[];
  isLoading?: boolean;
}

export function SuccessRateDashboard({ devices, isLoading }: SuccessRateDashboardProps) {
  // Calculate success rate statistics
  const devicesWithSuccess = devices.filter(d => 
    d.report?.percentSuccess !== undefined && d.report.percentSuccess !== null
  );

  const avgSuccessRate = devicesWithSuccess.length > 0
    ? devicesWithSuccess.reduce((acc, d) => acc + (d.report?.percentSuccess || 0), 0) / devicesWithSuccess.length
    : 0;

  // Group devices by success rate categories
  const categories = {
    excellent: devicesWithSuccess.filter(d => (d.report?.percentSuccess || 0) >= 95),
    good: devicesWithSuccess.filter(d => 
      (d.report?.percentSuccess || 0) >= 85 && (d.report?.percentSuccess || 0) < 95
    ),
    warning: devicesWithSuccess.filter(d => 
      (d.report?.percentSuccess || 0) >= 70 && (d.report?.percentSuccess || 0) < 85
    ),
    critical: devicesWithSuccess.filter(d => (d.report?.percentSuccess || 0) < 70),
  };

  // Calculate reconnect statistics
  const devicesWithReconnects = devices.filter(d => 
    d.report?.reconnects !== undefined && d.report.reconnects !== null
  );

  const totalReconnects = devicesWithReconnects.reduce((acc, d) => 
    acc + (d.report?.reconnects || 0), 0
  );

  const avgReconnects = devicesWithReconnects.length > 0
    ? totalReconnects / devicesWithReconnects.length
    : 0;

  // Get status badge variant
  const getStatusVariant = (rate: number) => {
    if (rate >= 95) return 'default';
    if (rate >= 85) return 'secondary';
    if (rate >= 70) return 'outline';
    return 'destructive';
  };

  // Get status color
  const getStatusColor = (rate: number) => {
    if (rate >= 95) return 'bg-green-500';
    if (rate >= 85) return 'bg-blue-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Verbindungs-Zuverlässigkeit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Success Rate Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Erfolgsrate
            </CardTitle>
            <Badge variant={getStatusVariant(avgSuccessRate)}>
              {avgSuccessRate >= 95 ? 'Optimal' : 
               avgSuccessRate >= 85 ? 'Gut' :
               avgSuccessRate >= 70 ? 'Warnung' : 'Kritisch'}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Durchschnittliche Verbindungserfolgsrate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Main Success Rate */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold">{avgSuccessRate.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">%</span>
                {avgSuccessRate >= 85 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <Progress 
                value={avgSuccessRate} 
                className="h-2"
              />
            </div>

            {/* Device Categories */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-xs">Optimal (≥95%)</span>
                </span>
                <span className="font-medium">{categories.excellent.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-xs">Gut (85-95%)</span>
                </span>
                <span className="font-medium">{categories.good.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs">Warnung (70-85%)</span>
                </span>
                <span className="font-medium">{categories.warning.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-xs">Kritisch (&lt;70%)</span>
                </span>
                <span className="font-medium">{categories.critical.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reconnects Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Wiederverbindungen
          </CardTitle>
          <CardDescription className="text-xs">
            Verbindungsunterbrechungen und Wiederherstellungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Total Reconnects */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold">{totalReconnects}</span>
                <span className="text-sm text-muted-foreground">gesamt</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ø {avgReconnects.toFixed(1)} pro Gerät
              </p>
            </div>

            {/* Reconnect Distribution */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Verteilung</p>
              <div className="space-y-1">
                {[
                  { label: 'Keine', count: devicesWithReconnects.filter(d => (d.report?.reconnects || 0) === 0).length },
                  { label: '1-5', count: devicesWithReconnects.filter(d => (d.report?.reconnects || 0) > 0 && (d.report?.reconnects || 0) <= 5).length },
                  { label: '6-10', count: devicesWithReconnects.filter(d => (d.report?.reconnects || 0) > 5 && (d.report?.reconnects || 0) <= 10).length },
                  { label: '>10', count: devicesWithReconnects.filter(d => (d.report?.reconnects || 0) > 10).length },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Count */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {devicesWithReconnects.length} von {devices.length} Geräten mit Daten
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}