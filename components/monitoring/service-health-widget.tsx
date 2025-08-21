'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Server, Clock } from 'lucide-react';
import { spineApi } from '@/lib/api/client';
import { useState, useEffect, ReactNode } from 'react';

interface ServiceHealthWidgetProps {
  className?: string;
}

export function ServiceHealthWidget({ className }: ServiceHealthWidgetProps) {
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const { data: health, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['service-health'],
    queryFn: async () => {
      const result = await spineApi.getServiceHealth();
      setLastChecked(new Date());
      return result;
    },
    refetchInterval: 60000, // Check every minute
    retry: 2,
  });

  const { data: version } = useQuery({
    queryKey: ['service-version'],
    queryFn: () => spineApi.getServiceVersion(),
    staleTime: 300000, // Cache for 5 minutes
  });

  const { data: serviceName } = useQuery({
    queryKey: ['service-name'],
    queryFn: () => spineApi.getServiceName(),
    staleTime: 300000, // Cache for 5 minutes
  });

  // Format time since last check
  const [timeAgo, setTimeAgo] = useState('gerade eben');
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastChecked.getTime()) / 1000);
      
      if (diff < 5) {
        setTimeAgo('gerade eben');
      } else if (diff < 60) {
        setTimeAgo(`vor ${diff} Sek.`);
      } else {
        const minutes = Math.floor(diff / 60);
        setTimeAgo(`vor ${minutes} Min.`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastChecked]);

  const isHealthy = !healthError && health;
  
  const getStatusIcon = (): ReactNode => {
    if (healthLoading) return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
    if (isHealthy) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (healthError) return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (): ReactNode => {
    if (healthLoading) return <Badge variant="secondary">Prüfe...</Badge>;
    if (isHealthy) return <Badge variant="default">Online</Badge>;
    if (healthError) return <Badge variant="destructive">Offline</Badge>;
    return <Badge variant="outline">Unbekannt</Badge>;
  };

  const getStatusMessage = (): string => {
    if (healthLoading) return 'Verbindung wird hergestellt...';
    if (isHealthy) return 'Alle Systeme funktionieren normal';
    if (healthError) return 'Verbindung zum Service nicht möglich';
    return 'Service-Status unbekannt';
  };

  const getUptime = (): string | null => {
    // If the API returns uptime information, use it
    if (health && typeof health === 'object' && 'uptime' in health) {
      const uptimeSeconds = (health as Record<string, unknown>).uptime as number;
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      
      if (days > 0) return `${days} Tag${days !== 1 ? 'e' : ''}, ${hours} Std.`;
      if (hours > 0) return `${hours} Std., ${minutes} Min.`;
      return `${minutes} Min.`;
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Server className="h-5 w-5" />
            Service Status
          </CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription className="text-xs">
          API Verfügbarkeit und System-Gesundheit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Status */}
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <p className="text-sm font-medium">{getStatusMessage()}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                Geprüft {timeAgo}
              </p>
            </div>
          </div>

          {/* Service Details */}
          {(serviceName || version) && (
            <div className="space-y-2 pt-2 border-t">
              {serviceName && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">
                    {typeof serviceName === 'string' ? serviceName : 'Spine Energy API'}
                  </span>
                </div>
              )}
              {version && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">
                    {typeof version === 'string' ? version : 
                     typeof version === 'object' && version !== null && 'version' in version 
                       ? (version as Record<string, unknown>).version as string : 'v2.0'}
                  </span>
                </div>
              )}
              {getUptime() && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-medium">{getUptime()}</span>
                </div>
              )}
            </div>
          )}

          {/* Response Details */}
          {health && typeof health === 'object' && 'status' in health && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground">Komponenten</p>
              {Object.entries(health as Record<string, unknown>).map(([key, value]) => {
                if (key === 'status' || key === 'uptime') return null;
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="font-medium">
                      {typeof value === 'boolean' ? (
                        value ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )
                      ) : (
                        String(value)
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Error Details */}
          {healthError && (
            <div className="pt-2 border-t">
              <p className="text-xs text-red-600">
                Fehler: {healthError.message}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}