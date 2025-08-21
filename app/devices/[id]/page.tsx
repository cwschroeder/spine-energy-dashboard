'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SignalIndicator } from '@/components/devices/signal-indicator';
import { useDeviceDetails } from '@/hooks/use-devices';
import { 
  ArrowLeft, 
  RefreshCw, 
  MapPin, 
  Network, 
  Clock, 
  Activity,
  AlertCircle,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function DeviceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const deviceId = params.id as string;
  
  const { data: device, isLoading, error, refetch } = useDeviceDetails(deviceId) as {
    data: any;
    isLoading: boolean;
    error: any;
    refetch: () => void;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm:ss', { locale: de });
    } catch {
      return 'N/A';
    }
  };

  const getLatestReport = () => {
    if (device?.reports && device.reports.length > 0) {
      return device.reports[0];
    }
    return device?.report;
  };

  const getChartData = () => {
    if (!device?.reports) return [];
    
    return device.reports.slice(0, 24).map((report: any) => ({
      time: format(new Date(report.reportTimestamp), 'HH:mm'),
      signalStrength: Math.abs(report.signalStrength),
      linkQuality: report.linkQuality,
    }));
  };

  const latestReport = getLatestReport();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Fehler beim Laden der Gerätedetails: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!device) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/devices')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{device.device_id}</h1>
            {device.alias && (
              <p className="text-muted-foreground">{device.alias}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <SignalIndicator
              signal={device.signal}
              signalStrength={latestReport?.signalStrength}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Netzwerk</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {latestReport?.network && (
                <Badge variant="outline">
                  {Array.isArray(latestReport.network) 
                    ? latestReport.network[0]?.name 
                    : latestReport.network.name}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground">
                {latestReport?.ips?.[0] || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Letzter Kontakt</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(device.lastOnline)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Standort</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm truncate">
              {device.config?.location?.description || 'Nicht definiert'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="signal">Signalverlauf</TabsTrigger>
          <TabsTrigger value="network">Netzwerk</TabsTrigger>
          <TabsTrigger value="config">Konfiguration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geräteinformationen</CardTitle>
              <CardDescription>Detaillierte Informationen zum Gateway</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Geräte-ID</dt>
                  <dd className="text-sm font-mono">{device.device_id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Gerätetyp</dt>
                  <dd className="text-sm">{device.device_type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Erste Verbindung</dt>
                  <dd className="text-sm">{formatDate(device.firstOnline)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Update-Intervall</dt>
                  <dd className="text-sm">{device.config?.updateInterval || 'PT5M'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Registrierungs-ID</dt>
                  <dd className="text-sm font-mono">
                    {Array.isArray(latestReport?.registrationId)
                      ? latestReport.registrationId[0]
                      : latestReport?.registrationId || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Lifetime</dt>
                  <dd className="text-sm">{latestReport?.lifetime || 0} Sekunden</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Signalstärke Verlauf</CardTitle>
              <CardDescription>Signalstärke der letzten 24 Stunden</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="signalStrength"
                    stroke="#8884d8"
                    name="Signalstärke (dBm)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Netzwerkinformationen</CardTitle>
              <CardDescription>Aktuelle Netzwerkverbindung und -konfiguration</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">IP-Adressen</dt>
                  <dd className="text-sm font-mono">
                    {latestReport?.ips?.join(', ') || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">APNs</dt>
                  <dd className="text-sm">
                    {latestReport?.apns?.join(', ') || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Adresse</dt>
                  <dd className="text-sm font-mono">
                    {Array.isArray(latestReport?.address)
                      ? latestReport.address[0]
                      : latestReport?.address || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Verfügbare Netzwerke</dt>
                  <dd className="text-sm">
                    {latestReport?.availableNetworks
                      ?.map((n: any) => n.name)
                      .join(', ') || 'N/A'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Konfiguration</CardTitle>
              <CardDescription>Gateway-Konfiguration und Einstellungen</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Update-Intervall</dt>
                  <dd className="text-sm">{device.config?.updateInterval || 'PT5M'}</dd>
                </div>
                {device.config?.location && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Standort</dt>
                      <dd className="text-sm">{device.config.location.description}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Koordinaten</dt>
                      <dd className="text-sm font-mono">
                        {device.config.location.latitude}, {device.config.location.longitude}
                      </dd>
                    </div>
                  </>
                )}
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Tags</dt>
                  <dd className="text-sm">
                    {Object.keys(device.tags || {}).length > 0
                      ? JSON.stringify(device.tags, null, 2)
                      : 'Keine Tags definiert'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}