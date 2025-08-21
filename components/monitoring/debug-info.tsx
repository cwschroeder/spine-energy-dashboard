'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Info, Database, Wifi } from 'lucide-react';
import type { Device } from '@/lib/api/types';

interface DebugInfoProps {
  devices: Device[];
  className?: string;
}

export function DebugInfo({ devices, className }: DebugInfoProps) {
  // Analyze available data fields
  const dataAnalysis = {
    total: devices.length,
    withReports: devices.filter(d => d.report).length,
    withSNR: devices.filter(d => d.report?.snr !== undefined).length,
    withPercentSuccess: devices.filter(d => d.report?.percentSuccess !== undefined).length,
    withReconnects: devices.filter(d => d.report?.reconnects !== undefined).length,
    withCellData: devices.filter(d => d.report?.cellId || d.report?.lac).length,
    withMccMnc: devices.filter(d => d.report?.smcc || d.report?.smnc).length,
    withLifetime: devices.filter(d => d.report?.lifetime !== undefined).length,
    withLocation: devices.filter(d => d.config?.location?.latitude && d.config?.location?.longitude).length,
  };

  // Sample device data structure
  const sampleDevice = devices.find(d => d.report) || devices[0];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className={`cursor-pointer hover:shadow-lg transition-shadow ${className}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Info className="h-5 w-5" />
              Debug-Info
            </CardTitle>
            <CardDescription className="text-xs">
              Datenstruktur und Verfügbarkeit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Database className="h-4 w-4 mr-2" />
              Details anzeigen
            </Button>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Debug-Informationen</DialogTitle>
          <DialogDescription>
            Analyse der verfügbaren API-Datenfelder
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Data Availability */}
          <div>
            <h3 className="text-sm font-medium mb-3">Datenverfügbarkeit</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-xs">Gesamtgeräte</span>
                <Badge variant="outline">{dataAnalysis.total}</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-xs">Mit Reports</span>
                <Badge variant={dataAnalysis.withReports > 0 ? "default" : "destructive"}>
                  {dataAnalysis.withReports}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-xs">SNR Daten</span>
                <Badge variant={dataAnalysis.withSNR > 0 ? "default" : "destructive"}>
                  {dataAnalysis.withSNR}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-xs">Success Rate</span>
                <Badge variant={dataAnalysis.withPercentSuccess > 0 ? "default" : "destructive"}>
                  {dataAnalysis.withPercentSuccess}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-xs">Reconnects</span>
                <Badge variant={dataAnalysis.withReconnects > 0 ? "default" : "destructive"}>
                  {dataAnalysis.withReconnects}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-xs">Cell Daten</span>
                <Badge variant={dataAnalysis.withCellData > 0 ? "default" : "destructive"}>
                  {dataAnalysis.withCellData}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-xs">MCC/MNC</span>
                <Badge variant={dataAnalysis.withMccMnc > 0 ? "default" : "destructive"}>
                  {dataAnalysis.withMccMnc}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-xs">Standorte</span>
                <Badge variant={dataAnalysis.withLocation > 0 ? "default" : "destructive"}>
                  {dataAnalysis.withLocation}
                </Badge>
              </div>
            </div>
          </div>

          {/* Sample Device Structure */}
          {sampleDevice && (
            <div>
              <h3 className="text-sm font-medium mb-3">Beispiel-Datenstruktur</h3>
              <div className="bg-muted p-3 rounded text-xs overflow-x-auto">
                <pre className="whitespace-pre-wrap">
{JSON.stringify({
  device_id: sampleDevice.device_id,
  signal: sampleDevice.signal,
  report: sampleDevice.report ? {
    snr: sampleDevice.report.snr,
    percentSuccess: sampleDevice.report.percentSuccess,
    reconnects: sampleDevice.report.reconnects,
    lifetime: sampleDevice.report.lifetime,
    cellId: sampleDevice.report.cellId,
    lac: sampleDevice.report.lac,
    smcc: sampleDevice.report.smcc,
    smnc: sampleDevice.report.smnc,
    signalStrength: sampleDevice.report.signalStrength,
    linkQuality: sampleDevice.report.linkQuality,
    network: sampleDevice.report.network,
  } : null,
  config: sampleDevice.config ? {
    location: sampleDevice.config.location
  } : null
}, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div>
            <h3 className="text-sm font-medium mb-3">Empfehlungen</h3>
            <div className="space-y-2">
              {dataAnalysis.withSNR === 0 && (
                <div className="flex items-center gap-2 text-xs text-yellow-600">
                  <Wifi className="h-3 w-3" />
                  <span>Keine SNR-Daten verfügbar - SNR Widget wird leer angezeigt</span>
                </div>
              )}
              {dataAnalysis.withPercentSuccess === 0 && (
                <div className="flex items-center gap-2 text-xs text-yellow-600">
                  <Info className="h-3 w-3" />
                  <span>Keine percentSuccess-Daten - Success Rate Dashboard zeigt 0%</span>
                </div>
              )}
              {dataAnalysis.withReconnects === 0 && (
                <div className="flex items-center gap-2 text-xs text-yellow-600">
                  <Info className="h-3 w-3" />
                  <span>Keine Reconnect-Daten - Wiederverbindungsstatistiken nicht verfügbar</span>
                </div>
              )}
              {dataAnalysis.withCellData === 0 && dataAnalysis.withMccMnc === 0 && (
                <div className="flex items-center gap-2 text-xs text-yellow-600">
                  <Database className="h-3 w-3" />
                  <span>Keine Netzwerk-Daten - Netzwerk-Analyse nicht möglich</span>
                </div>
              )}
              {dataAnalysis.withLocation === 0 && (
                <div className="flex items-center gap-2 text-xs text-yellow-600">
                  <Info className="h-3 w-3" />
                  <span>Keine Standortdaten - Karte wird leer angezeigt</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}