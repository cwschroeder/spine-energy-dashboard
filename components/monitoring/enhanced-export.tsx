'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, FileText, Table, BarChart } from 'lucide-react';
import type { Device } from '@/lib/api/types';

interface EnhancedExportProps {
  devices: Device[];
  className?: string;
}

export function EnhancedExport({ devices, className }: EnhancedExportProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx'>('csv');
  const [exportScope, setExportScope] = useState<'all' | 'enhanced' | 'network'>('enhanced');
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async () => {
    setIsExporting(true);
    
    try {
      let dataToExport: any[] = [];
      
      switch (exportScope) {
        case 'all':
          dataToExport = devices.map(device => ({
            device_id: device.device_id,
            alias: device.alias,
            signal: device.signal,
            timestamp: device.timestamp,
            lastOnline: device.lastOnline,
            signalStrength: device.report?.signalStrength,
            linkQuality: device.report?.linkQuality,
            network: Array.isArray(device.report?.network) 
              ? device.report.network[0]?.name 
              : device.report?.network?.name,
            bearer: Array.isArray(device.report?.network) 
              ? device.report.network[0]?.bearer 
              : device.report?.network?.bearer,
            location_lat: device.config?.location?.latitude,
            location_lng: device.config?.location?.longitude,
            location_desc: device.config?.location?.description,
          }));
          break;
          
        case 'enhanced':
          dataToExport = devices
            .filter(d => d.report && (d.report.snr !== undefined || d.report.percentSuccess !== undefined || d.report.reconnects !== undefined))
            .map(device => ({
              device_id: device.device_id,
              alias: device.alias,
              signal: device.signal,
              timestamp: device.timestamp,
              lastOnline: device.lastOnline,
              // Enhanced metrics
              snr: device.report?.snr,
              percentSuccess: device.report?.percentSuccess,
              reconnects: device.report?.reconnects,
              lifetime: device.report?.lifetime,
              cellId: device.report?.cellId,
              lac: device.report?.lac,
              smcc: device.report?.smcc,
              smnc: device.report?.smnc,
              // Basic metrics
              signalStrength: device.report?.signalStrength,
              linkQuality: device.report?.linkQuality,
              registrationDate: device.report?.registrationDate,
              reportTimestamp: device.report?.reportTimestamp,
            }));
          break;
          
        case 'network':
          dataToExport = devices
            .filter(d => d.report && (d.report.cellId || d.report.lac || d.report.smcc || d.report.smnc))
            .map(device => ({
              device_id: device.device_id,
              alias: device.alias,
              signal: device.signal,
              // Network data
              cellId: device.report?.cellId,
              lac: device.report?.lac,
              smcc: device.report?.smcc,
              smnc: device.report?.smnc,
              network: Array.isArray(device.report?.network) 
                ? device.report.network[0]?.name 
                : device.report?.network?.name,
              bearer: Array.isArray(device.report?.network) 
                ? device.report.network[0]?.bearer 
                : device.report?.network?.bearer,
              // Performance metrics
              signalStrength: device.report?.signalStrength,
              snr: device.report?.snr,
              linkQuality: device.report?.linkQuality,
              percentSuccess: device.report?.percentSuccess,
              reconnects: device.report?.reconnects,
            }));
          break;
      }

      await downloadData(dataToExport, exportFormat, exportScope);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadData = async (data: any[], format: string, scope: string) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `spine-energy-${scope}-${timestamp}`;

    switch (format) {
      case 'csv':
        downloadCSV(data, `${filename}.csv`);
        break;
      case 'json':
        downloadJSON(data, `${filename}.json`);
        break;
      case 'xlsx':
        // For XLSX, we'd need a library like xlsx or exceljs
        // For now, fallback to CSV
        downloadCSV(data, `${filename}.csv`);
        break;
    }
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
  };

  const downloadJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    downloadBlob(blob, filename);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const getExportStats = () => {
    switch (exportScope) {
      case 'all':
        return {
          count: devices.length,
          description: 'Alle Geräte mit Basis-Informationen',
        };
      case 'enhanced':
        return {
          count: devices.filter(d => d.report && (d.report.snr !== undefined || d.report.percentSuccess !== undefined || d.report.reconnects !== undefined)).length,
          description: 'Geräte mit erweiterten Metriken (SNR, Success Rate, Reconnects)',
        };
      case 'network':
        return {
          count: devices.filter(d => d.report && (d.report.cellId || d.report.lac || d.report.smcc || d.report.smnc)).length,
          description: 'Geräte mit Netzwerk-Daten (Cell ID, LAC, MCC/MNC)',
        };
      default:
        return { count: 0, description: '' };
    }
  };

  const stats = getExportStats();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className={`cursor-pointer hover:shadow-lg transition-shadow ${className}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Download className="h-5 w-5" />
              Daten Export
            </CardTitle>
            <CardDescription className="text-xs">
              Erweiterte Export-Funktionen für Reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export öffnen
            </Button>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Daten Export</DialogTitle>
          <DialogDescription>
            Wählen Sie Format und Umfang für den Datenexport aus.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Export Scope */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Export-Umfang</label>
            <Select value={exportScope} onValueChange={(value: any) => setExportScope(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    Alle Geräte
                  </div>
                </SelectItem>
                <SelectItem value="enhanced">
                  <div className="flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    Erweiterte Metriken
                  </div>
                </SelectItem>
                <SelectItem value="network">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Netzwerk-Daten
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Format */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Export-Format</label>
            <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                <SelectItem value="json">JSON (JavaScript Object)</SelectItem>
                <SelectItem value="xlsx" disabled>XLSX (Excel) - Coming Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Statistics */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Export-Statistiken</span>
              <Badge variant="secondary">{stats.count} Datensätze</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{stats.description}</p>
          </div>

          {/* Export Button */}
          <Button 
            onClick={exportData} 
            disabled={isExporting || stats.count === 0}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Download className="h-4 w-4 mr-2 animate-spin" />
                Exportiere...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export starten ({stats.count} Datensätze)
              </>
            )}
          </Button>

          {stats.count === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Keine Daten für den gewählten Umfang verfügbar
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}