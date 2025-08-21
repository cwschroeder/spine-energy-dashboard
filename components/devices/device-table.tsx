'use client';

import { useState, useMemo } from 'react';
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
import { Eye, Download, Search, Filter, FileDown, FileJson, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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

type SortField = 'device_id' | 'alias' | 'signal' | 'network' | 'ip' | 'lastOnline' | 'location';
type SortOrder = 'asc' | 'desc';

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
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSignalPriority = (signal?: string): number => {
    switch (signal) {
      case 'green': return 3;
      case 'yellow': return 2;
      case 'red': return 1;
      case 'grey': return 0;
      default: return -1;
    }
  };

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

  const sortedAndFilteredDevices = useMemo(() => {
    // First filter
    let filtered = devices.filter((device) => {
      const matchesSearch =
        device.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.alias && device.alias.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSignal = signalFilter === 'all' || device.signal === signalFilter;

      return matchesSearch && matchesSignal;
    });

    // Then sort
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'device_id':
            aValue = a.device_id;
            bValue = b.device_id;
            break;
          case 'alias':
            aValue = a.alias || '';
            bValue = b.alias || '';
            break;
          case 'signal':
            aValue = getSignalPriority(a.signal);
            bValue = getSignalPriority(b.signal);
            break;
          case 'network':
            aValue = getNetworkType(a);
            bValue = getNetworkType(b);
            break;
          case 'ip':
            aValue = a.report?.ips?.[0] || '';
            bValue = b.report?.ips?.[0] || '';
            break;
          case 'lastOnline':
            aValue = a.lastOnline ? new Date(a.lastOnline).getTime() : 0;
            bValue = b.lastOnline ? new Date(b.lastOnline).getTime() : 0;
            break;
          case 'location':
            aValue = a.config?.location?.description || '';
            bValue = b.config?.location?.description || '';
            break;
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [devices, searchTerm, signalFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(total / per);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-2 text-muted-foreground" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-2" />
      : <ArrowDown className="h-4 w-4 ml-2" />;
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
            <DropdownMenuItem onClick={() => exportToCSV(sortedAndFilteredDevices, generateExportFilename('spine_devices', 'csv'))}>
              <FileDown className="h-4 w-4 mr-2" />
              Als CSV exportieren
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportToJSON(sortedAndFilteredDevices, generateExportFilename('spine_devices', 'json'))}>
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
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('device_id')}
              >
                <div className="flex items-center">
                  Geräte-ID
                  <SortIcon field="device_id" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('alias')}
              >
                <div className="flex items-center">
                  Alias
                  <SortIcon field="alias" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('signal')}
              >
                <div className="flex items-center">
                  Signal
                  <SortIcon field="signal" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('network')}
              >
                <div className="flex items-center">
                  Netzwerk
                  <SortIcon field="network" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('ip')}
              >
                <div className="flex items-center">
                  IP-Adresse
                  <SortIcon field="ip" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('lastOnline')}
              >
                <div className="flex items-center">
                  Letzter Kontakt
                  <SortIcon field="lastOnline" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('location')}
              >
                <div className="flex items-center">
                  Standort
                  <SortIcon field="location" />
                </div>
              </TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredDevices.map((device) => (
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