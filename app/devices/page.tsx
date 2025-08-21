'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeviceTable } from '@/components/devices/device-table';
import { useDevices } from '@/hooks/use-devices';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Cpu, Wifi, WifiOff, Activity } from 'lucide-react';

export default function DevicesPage() {
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(50);
  
  const { data, isLoading, error } = useDevices(page, per);

  const getStatusCounts = () => {
    if (!data?.devices) return { green: 0, yellow: 0, red: 0, grey: 0 };
    
    return data.devices.reduce((acc, device) => {
      acc[device.signal] = (acc[device.signal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Geräte</h1>
        <p className="text-muted-foreground">
          Verwalten und überwachen Sie Ihre Smart Meter Gateways
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Geräte</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || '0'}</div>
            <p className="text-xs text-muted-foreground">Registrierte Gateways</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.green || 0}</div>
            <p className="text-xs text-muted-foreground">Sehr gute Verbindung</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnung</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(statusCounts.yellow || 0) + (statusCounts.red || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Schwache Verbindung</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.grey || 0}</div>
            <p className="text-xs text-muted-foreground">Keine Verbindung</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Geräteliste</CardTitle>
          <CardDescription>
            Übersicht aller registrierten Smart Meter Gateways
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Fehler beim Laden der Geräte: {error.message}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          ) : data ? (
            <DeviceTable
              devices={data.devices}
              total={parseInt(data.total, 10)}
              page={page}
              per={per}
              onPageChange={setPage}
              onPerPageChange={(newPer) => {
                setPer(newPer);
                setPage(1);
              }}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}