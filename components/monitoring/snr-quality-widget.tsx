'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { WifiIcon, SignalHighIcon, SignalLowIcon, SignalMediumIcon } from 'lucide-react';
import type { Device } from '@/lib/api/types';

interface SNRQualityWidgetProps {
  devices: Device[];
  isLoading?: boolean;
}

export function SNRQualityWidget({ devices, isLoading }: SNRQualityWidgetProps) {
  // Calculate SNR statistics
  const devicesWithSNR = devices.filter(d => d.report?.snr !== undefined && d.report.snr !== null);
  
  const avgSNR = devicesWithSNR.length > 0
    ? devicesWithSNR.reduce((acc, d) => acc + (d.report?.snr || 0), 0) / devicesWithSNR.length
    : 0;

  const minSNR = devicesWithSNR.length > 0
    ? Math.min(...devicesWithSNR.map(d => d.report?.snr || 0))
    : 0;

  const maxSNR = devicesWithSNR.length > 0
    ? Math.max(...devicesWithSNR.map(d => d.report?.snr || 0))
    : 0;

  // SNR quality thresholds
  const getQualityLevel = (snr: number) => {
    if (snr >= 20) return { label: 'Exzellent', color: 'bg-green-500', badge: 'default' };
    if (snr >= 13) return { label: 'Gut', color: 'bg-blue-500', badge: 'secondary' };
    if (snr >= 7) return { label: 'Mäßig', color: 'bg-yellow-500', badge: 'outline' };
    return { label: 'Schwach', color: 'bg-red-500', badge: 'destructive' };
  };

  const quality = getQualityLevel(avgSNR);

  // Distribution of SNR quality
  const distribution = {
    excellent: devicesWithSNR.filter(d => (d.report?.snr || 0) >= 20).length,
    good: devicesWithSNR.filter(d => (d.report?.snr || 0) >= 13 && (d.report?.snr || 0) < 20).length,
    moderate: devicesWithSNR.filter(d => (d.report?.snr || 0) >= 7 && (d.report?.snr || 0) < 13).length,
    poor: devicesWithSNR.filter(d => (d.report?.snr || 0) < 7).length,
  };

  const getSignalIcon = () => {
    if (avgSNR >= 20) return <SignalHighIcon className="h-5 w-5" />;
    if (avgSNR >= 13) return <SignalMediumIcon className="h-5 w-5" />;
    if (avgSNR >= 7) return <SignalLowIcon className="h-5 w-5" />;
    return <WifiIcon className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Signal-to-Noise Ratio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getSignalIcon()}
            Signal-to-Noise Ratio
          </CardTitle>
          <Badge variant={quality.badge as any}>
            {quality.label}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Durchschnittliche Signalqualität aller Geräte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main SNR Value */}
          <div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold">{avgSNR.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground mb-1">dB</span>
            </div>
            <Progress 
              value={(avgSNR / 30) * 100} 
              className="h-2"
            />
          </div>

          {/* Min/Max Range */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Min: {minSNR.toFixed(1)} dB</span>
            <span>Max: {maxSNR.toFixed(1)} dB</span>
          </div>

          {/* Distribution */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Verteilung</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs">Exzellent: {distribution.excellent}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs">Gut: {distribution.good}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-xs">Mäßig: {distribution.moderate}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs">Schwach: {distribution.poor}</span>
              </div>
            </div>
          </div>

          {/* Device Count */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {devicesWithSNR.length} von {devices.length} Geräten mit SNR-Daten
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}