'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SignalIndicator } from './signal-indicator';
import { Eye, Download, Search, Filter, FileDown, FileJson } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Device } from '@/lib/api/types';
import { exportToCSV, exportToJSON, generateExportFilename } from '@/lib/export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DeviceTableProps {
  devices: Device[];
  total: number;
  page: number;
  per: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (per: number) => void;
}

export function DeviceTable({
  devices,
  total,
  page,
  per,
  onPageChange,
  onPerPageChange,
}: DeviceTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [signalFilter, setSignalFilter] = useState<string>('all');

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.alias && device.alias.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSignal = signalFilter === 'all' || device.signal === signalFilter;

    return matchesSearch && matchesSignal;
  });

  const totalPages = Math.ceil(total / per);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: de });
    } catch {
      return 'N/A';
    }
  };

  const getNetworkType = (device: Device) => {
    if (device.report?.network) {
      if (Array.isArray(device.report.network)) {
        return device.report.network[0]?.name || 'N/A';
      }
      return device.report.network.name;
    }
    return 'N/A';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Suche nach ID oder Alias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <Select value={signalFilter} onValueChange={setSignalFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Signal Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Signale</SelectItem>
              <SelectItem value="green">Sehr gut</SelectItem>
              <SelectItem value="yellow">Gut</SelectItem>
              <SelectItem value="red">Schwach</SelectItem>
              <SelectItem value="grey">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => exportToCSV(filteredDevices, generateExportFilename('spine_devices', 'csv'))}>
              <FileDown className="h-4 w-4 mr-2" />
              Als CSV exportieren
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportToJSON(filteredDevices, generateExportFilename('spine_devices', 'json'))}>
              <FileJson className="h-4 w-4 mr-2" />
              Als JSON exportieren
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Geräte-ID</TableHead>
              <TableHead>Alias</TableHead>
              <TableHead>Signal</TableHead>
              <TableHead>Netzwerk</TableHead>
              <TableHead>IP-Adresse</TableHead>
              <TableHead>Letzter Kontakt</TableHead>
              <TableHead>Standort</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDevices.map((device) => (
              <TableRow
                key={device.device_id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/devices/${device.device_id}`)}
              >
                <TableCell className="font-medium">{device.device_id}</TableCell>
                <TableCell>{device.alias || '-'}</TableCell>
                <TableCell>
                  <SignalIndicator
                    signal={device.signal}
                    signalStrength={device.report?.signalStrength}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getNetworkType(device)}</Badge>
                </TableCell>
                <TableCell>
                  {device.report?.ips?.[0] || 'N/A'}
                </TableCell>
                <TableCell>{formatDate(device.lastOnline)}</TableCell>
                <TableCell>
                  {device.config?.location?.description ? (
                    <span className="text-sm truncate max-w-xs block">
                      {device.config.location.description}
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/devices/${device.device_id}`);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Zeige {(page - 1) * per + 1} bis {Math.min(page * per, total)} von {total} Geräten
          </span>
          <Select
            value={per.toString()}
            onValueChange={(value) => onPerPageChange(parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            Zurück
          </Button>
          <span className="text-sm">
            Seite {page} von {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            Weiter
          </Button>
        </div>
      </div>
    </div>
  );
}