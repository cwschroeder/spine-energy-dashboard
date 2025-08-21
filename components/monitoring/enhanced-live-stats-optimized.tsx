'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Device } from '@/lib/api/types';
import { Activity, TrendingUp, Wifi, WifiOff, Server, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

interface EnhancedLiveStatsProps {
  devices: Device[];
  isLoading?: boolean;
}

export function EnhancedLiveStatsOptimized({ devices, isLoading }: EnhancedLiveStatsProps) {
  const stats = useMemo(() => {
    const total = devices.length;
    const online = devices.filter(d => d.signal !== 'grey').length;
    const optimal = devices.filter(d => d.signal === 'green').length;
    const warning = devices.filter(d => d.signal === 'yellow').length;
    const critical = devices.filter(d => d.signal === 'red').length;
    const offline = devices.filter(d => d.signal === 'grey').length;
    
    const avgSignal = devices.reduce((acc, device) => {
      if (device.report?.signalStrength) {
        return acc + device.report.signalStrength;
      }
      return acc;
    }, 0) / devices.filter(d => d.report?.signalStrength).length;

    return {
      total,
      online,
      onlineRate: total > 0 ? (online / total) * 100 : 0,
      optimal,
      warning,
      critical,
      offline,
      avgSignal: avgSignal || -91,
    };
  }, [devices]);

  const getNetworkStats = useMemo(() => {
    const networks: Record<string, number> = {};
    devices.forEach(device => {
      if (device.report?.network) {
        const networkName = Array.isArray(device.report.network)
          ? device.report.network[0]?.name
          : device.report.network.name;
        if (networkName) {
          networks[networkName] = (networks[networkName] || 0) + 1;
        }
      }
    });
    return Object.entries(networks).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [devices]);

  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Stats Cards - Compact */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Online Rate</CardTitle>
              <Activity className="h-3.5 w-3.5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{stats.onlineRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.online} von {stats.total} Geräten
              </p>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.onlineRate}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Ø Signalstärke</CardTitle>
              <Wifi className="h-3.5 w-3.5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{stats.avgSignal.toFixed(0)} dBm</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.avgSignal >= -70 ? 'Ausgezeichnet' : 
                 stats.avgSignal >= -85 ? 'Gut' : 
                 stats.avgSignal >= -95 ? 'Mittel' : 'Schwach'}
              </p>
              <div className="mt-2 flex gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-3 flex-1 rounded-sm ${
                      i < Math.ceil((100 + stats.avgSignal) / 25) 
                        ? 'bg-blue-500' 
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Kürzlich aktualisiert</CardTitle>
              <Clock className="h-3.5 w-3.5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {devices.filter(d => {
                  if (!d.lastOnline) return false;
                  const lastOnline = new Date(d.lastOnline);
                  const now = new Date();
                  const diffMinutes = (now.getTime() - lastOnline.getTime()) / (1000 * 60);
                  return diffMinutes <= 5;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Letzte 5 Minuten
              </p>
              <div className="mt-2">
                <AnimatePresence>
                  <motion.div
                    className="flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                    <span className="text-xs text-purple-600">Aktiv</span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Top Netzwerk</CardTitle>
              <Server className="h-3.5 w-3.5 text-orange-500" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <div>
                <div className="text-xl font-bold truncate">{getNetworkStats[0]?.[0] || 'N/A'}</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {getNetworkStats[0]?.[1] || 0} Geräte
                </p>
              </div>
              <div className="mt-3">
                <div className="flex gap-1">
                  {getNetworkStats.slice(0, 3).map((stat, i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 bg-orange-500 rounded-full"
                      style={{ 
                        opacity: 1 - (i * 0.3),
                        flex: stat[1] || 1
                      }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Status Distribution - Compact Horizontal */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Signal-Verteilung
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-4">
            <div className="flex items-center gap-4">
              {/* Compact Donut Chart */}
              <div className="relative flex-shrink-0">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-gray-100"
                  />
                  {(() => {
                    const circumference = 2 * Math.PI * 36;
                    let offset = 0;
                    
                    const segments = [
                      { count: stats.optimal, color: '#10b981', label: 'Optimal' },
                      { count: stats.warning, color: '#eab308', label: 'Gut' },
                      { count: stats.critical, color: '#ef4444', label: 'Schwach' },
                      { count: stats.offline, color: '#9ca3af', label: 'Offline' },
                    ];

                    return segments.map((segment, i) => {
                      const percentage = stats.total > 0 ? (segment.count / stats.total) * 100 : 0;
                      const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = isNaN(offset) ? 0 : -offset;
                      offset += (percentage / 100) * circumference;

                      return (
                        <motion.circle
                          key={i}
                          cx="48"
                          cy="48"
                          r="36"
                          fill="none"
                          stroke={segment.color}
                          strokeWidth="12"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-bold">{stats.total}</div>
                    <div className="text-[10px] text-muted-foreground">Geräte</div>
                  </div>
                </div>
              </div>
              
              {/* Compact Legend */}
              <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-1">
                {[
                  { label: 'Optimal', count: stats.optimal, color: 'bg-green-500' },
                  { label: 'Gut', count: stats.warning, color: 'bg-yellow-500' },
                  { label: 'Schwach', count: stats.critical, color: 'bg-red-500' },
                  { label: 'Offline', count: stats.offline, color: 'bg-gray-400' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.color} flex-shrink-0`} />
                    <span className="text-[11px] text-muted-foreground">{item.label}:</span>
                    <span className="text-[11px] font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              System Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Performance Metrics */}
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Verfügbarkeit</span>
                    <span className="text-xs font-medium">{stats.onlineRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${
                        stats.onlineRate >= 95 ? 'bg-green-500' :
                        stats.onlineRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.onlineRate}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Signalqualität</span>
                    <span className="text-xs font-medium">
                      {((100 + stats.avgSignal) / 30 * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${
                        stats.avgSignal >= -70 ? 'bg-green-500' :
                        stats.avgSignal >= -85 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(100 + stats.avgSignal) / 30 * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Optimal Status</span>
                    <span className="text-xs font-medium">
                      {stats.total > 0 ? ((stats.optimal / stats.total) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.total > 0 ? (stats.optimal / stats.total) * 100 : 0}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div className="text-center">
                  <div className="text-base font-bold text-green-600">{stats.optimal}</div>
                  <div className="text-[10px] text-muted-foreground">Optimal</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-bold text-yellow-600">{stats.warning}</div>
                  <div className="text-[10px] text-muted-foreground">Warnung</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-bold text-red-600">{stats.critical}</div>
                  <div className="text-[10px] text-muted-foreground">Kritisch</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}