'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Radio, MapPin, Smartphone, Network } from 'lucide-react';
import type { Device } from '@/lib/api/types';

interface NetworkAnalysisDashboardProps {
  devices: Device[];
  isLoading?: boolean;
}

export function NetworkAnalysisDashboard({ devices, isLoading }: NetworkAnalysisDashboardProps) {
  // Extract devices with network data
  const devicesWithNetwork = devices.filter(d => d.report && (d.report.cellId || d.report.lac || d.report.smcc || d.report.smnc));

  // Group devices by MCC/MNC (Mobile Network Operator)
  const networkOperators = devicesWithNetwork.reduce((acc, device) => {
    if (device.report?.smcc && device.report?.smnc) {
      const key = `${device.report.smcc}-${device.report.smnc}`;
      if (!acc[key]) {
        acc[key] = {
          mcc: device.report.smcc,
          mnc: device.report.smnc,
          devices: [],
          name: getOperatorName(device.report.smcc, device.report.smnc),
        };
      }
      acc[key].devices.push(device);
    }
    return acc;
  }, {} as Record<string, { mcc: number; mnc: number; devices: Device[]; name: string }>);

  // Group devices by Cell Tower
  const cellTowers = devicesWithNetwork.reduce((acc, device) => {
    if (device.report?.cellId && device.report?.lac) {
      const key = `${device.report.cellId}-${device.report.lac}`;
      if (!acc[key]) {
        acc[key] = {
          cellId: device.report.cellId,
          lac: device.report.lac,
          devices: [],
        };
      }
      acc[key].devices.push(device);
    }
    return acc;
  }, {} as Record<string, { cellId: number; lac: number; devices: Device[] }>);

  // Get operator name based on MCC/MNC (German operators)
  function getOperatorName(mcc: number, mnc: number): string {
    const operators: Record<string, string> = {
      '262-1': 'Telekom Deutschland',
      '262-2': 'Vodafone',
      '262-3': 'O2 Germany',
      '262-6': 'Telekom Deutschland',
      '262-7': 'O2 Germany',
      '262-8': 'O2 Germany',
      '262-15': 'Airdata',
    };
    return operators[`${mcc}-${mnc}`] || `MCC ${mcc} / MNC ${mnc}`;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Netzwerk-Analyse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (devicesWithNetwork.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Netzwerk-Analyse
          </CardTitle>
          <CardDescription>Keine Netzwerkdaten verfügbar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Derzeit sind keine Geräte mit Netzwerkdaten verfügbar.
            </p>
            <p className="text-xs text-muted-foreground">
              Benötigte Felder: cellId, lac, MCC/MNC
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Network Operators Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Network className="h-5 w-5" />
              Mobilfunkanbieter
            </CardTitle>
            <Badge variant="secondary">
              {Object.keys(networkOperators).length} Netze
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Verteilung der Geräte nach Mobilfunknetzen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.values(networkOperators)
              .sort((a, b) => b.devices.length - a.devices.length)
              .map((operator) => {
                const percentage = (operator.devices.length / devicesWithNetwork.length) * 100;
                
                return (
                  <div key={`${operator.mcc}-${operator.mnc}`} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{operator.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {operator.devices.length} Geräte
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
          
          {Object.keys(networkOperators).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Netzwerkdaten verfügbar
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cell Tower Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Funkzellen-Verteilung
            </CardTitle>
            <Badge variant="secondary">
              {Object.keys(cellTowers).length} Zellen
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Geräte gruppiert nach Funkzellen (Cell ID / LAC)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(cellTowers).length > 0 ? (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cell ID</TableHead>
                    <TableHead>LAC</TableHead>
                    <TableHead className="text-right">Geräte</TableHead>
                    <TableHead className="text-right">Avg. Signal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(cellTowers)
                    .sort((a, b) => b.devices.length - a.devices.length)
                    .slice(0, 10)
                    .map((tower) => {
                      const avgSignal = tower.devices.reduce((acc, d) => 
                        acc + (d.report?.signalStrength || 0), 0
                      ) / tower.devices.length;

                      return (
                        <TableRow key={`${tower.cellId}-${tower.lac}`}>
                          <TableCell className="font-mono text-sm">
                            {tower.cellId}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {tower.lac}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{tower.devices.length}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm">
                              {avgSignal.toFixed(0)} dBm
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              
              {Object.keys(cellTowers).length > 10 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  +{Object.keys(cellTowers).length - 10} weitere Funkzellen
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Funkzellen-Daten verfügbar
            </p>
          )}
        </CardContent>
      </Card>

      {/* Network Coverage Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Netzwerk-Zusammenfassung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Geräte mit Netzwerkdaten</p>
              <p className="text-2xl font-bold">{devicesWithNetwork.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Verschiedene Netze</p>
              <p className="text-2xl font-bold">{Object.keys(networkOperators).length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Funkzellen</p>
              <p className="text-2xl font-bold">{Object.keys(cellTowers).length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ø Geräte pro Zelle</p>
              <p className="text-2xl font-bold">
                {Object.keys(cellTowers).length > 0 
                  ? (devicesWithNetwork.length / Object.keys(cellTowers).length).toFixed(1)
                  : '0'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}