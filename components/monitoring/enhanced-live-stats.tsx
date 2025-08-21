'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  TrendingUp, 
  TrendingDown,
  Signal,
  Network,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { Device } from '@/lib/api/types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadialBarChart, RadialBar, Legend } from 'recharts';

interface EnhancedLiveStatsProps {
  devices: Device[];
  isLoading: boolean;
}

export function EnhancedLiveStats({ devices, isLoading }: EnhancedLiveStatsProps) {
  const getStatusCounts = () => {
    return devices.reduce((acc, device) => {
      acc[device.signal] = (acc[device.signal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const getNetworkDistribution = () => {
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
    return networks;
  };

  const getAverageSignalStrength = () => {
    const devicesWithSignal = devices.filter(d => d.report?.signalStrength);
    if (devicesWithSignal.length === 0) return 0;
    
    const sum = devicesWithSignal.reduce((acc, d) => acc + Math.abs(d.report!.signalStrength), 0);
    return Math.round(sum / devicesWithSignal.length);
  };

  const getRecentlyUpdated = () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    return devices.filter(d => {
      if (!d.lastOnline) return false;
      return new Date(d.lastOnline) > fiveMinutesAgo;
    }).length;
  };

  const statusCounts = getStatusCounts();
  const networkDist = getNetworkDistribution();
  const avgSignal = getAverageSignalStrength();
  const recentlyUpdated = getRecentlyUpdated();
  const totalDevices = devices.length;
  const onlineDevices = (statusCounts.green || 0) + (statusCounts.yellow || 0) + (statusCounts.red || 0);
  const offlineDevices = statusCounts.grey || 0;
  const onlinePercentage = totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0;

  // Data for pie chart
  const pieData = [
    { name: 'Sehr gut', value: statusCounts.green || 0, color: '#10b981' },
    { name: 'Gut', value: statusCounts.yellow || 0, color: '#eab308' },
    { name: 'Schwach', value: statusCounts.red || 0, color: '#ef4444' },
    { name: 'Offline', value: statusCounts.grey || 0, color: '#9ca3af' },
  ].filter(d => d.value > 0);

  // Data for radial chart
  const radialData = [
    {
      name: 'Online',
      value: onlinePercentage,
      fill: onlinePercentage > 80 ? '#10b981' : onlinePercentage > 60 ? '#eab308' : '#ef4444',
    }
  ];

  const signalQualityIcon = avgSignal < 85 ? CheckCircle : avgSignal < 100 ? AlertCircle : XCircle;
  const SignalIcon = signalQualityIcon;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-baseline space-x-2">
                <div className="text-3xl font-bold">{onlinePercentage.toFixed(1)}%</div>
                {onlinePercentage >= 90 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{onlineDevices} online</span>
                  <span>{totalDevices} gesamt</span>
                </div>
                <Progress value={onlinePercentage} className="h-2" />
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
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ø Signalstärke</CardTitle>
              <Signal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-baseline space-x-2">
                <div className="text-3xl font-bold">-{avgSignal}</div>
                <span className="text-sm text-muted-foreground">dBm</span>
              </div>
              <div className="flex items-center mt-3 space-x-2">
                <SignalIcon className={`h-4 w-4 ${
                  avgSignal < 85 ? 'text-green-500' : 
                  avgSignal < 100 ? 'text-yellow-500' : 'text-red-500'
                }`} />
                <Badge variant={avgSignal < 85 ? "default" : avgSignal < 100 ? "secondary" : "destructive"}>
                  {avgSignal < 85 ? 'Sehr gut' : avgSignal < 100 ? 'Mittel' : 'Schwach'}
                </Badge>
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
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-600/10" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kürzlich aktualisiert</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{recentlyUpdated}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Letzte 5 Minuten
              </p>
              {recentlyUpdated > 0 && (
                <motion.div 
                  className="flex items-center mt-2"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
                  <span className="text-xs text-green-500">Aktiv</span>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-600/10" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Netzwerke</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-2">
                {Object.entries(networkDist).map(([network, count]) => (
                  <div key={network} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{network}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-primary h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / totalDevices) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <Badge variant="outline" className="text-xs min-w-[2rem] text-center">{count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Signal-Verteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="60%" 
                  outerRadius="90%" 
                  data={radialData}
                  startAngle={180} 
                  endAngle={0}
                >
                  <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                  <Legend 
                    iconSize={10} 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="center"
                    formatter={() => `${onlinePercentage.toFixed(1)}% Online`}
                  />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{statusCounts.green || 0}</div>
                <div className="text-xs text-muted-foreground">Optimal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{(statusCounts.yellow || 0) + (statusCounts.red || 0)}</div>
                <div className="text-xs text-muted-foreground">Warnung</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-500">{statusCounts.grey || 0}</div>
                <div className="text-xs text-muted-foreground">Offline</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}