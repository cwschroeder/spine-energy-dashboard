'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Device } from '@/lib/api/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, AlertCircle, Clock, Network, Wifi, Activity } from 'lucide-react';
import { useMemo } from 'react';

interface StatisticsChartsProps {
  devices: Device[];
  isLoading?: boolean;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function StatisticsCharts({ devices, isLoading }: StatisticsChartsProps) {
  // Signal strength distribution data
  const signalData = useMemo(() => {
    const ranges = {
      'Sehr gut (-60 bis -70 dBm)': 0,
      'Gut (-70 bis -85 dBm)': 0,
      'Mittel (-85 bis -95 dBm)': 0,
      'Schwach (-95 bis -110 dBm)': 0,
    };

    devices.forEach(device => {
      if (device.report?.signalStrength) {
        const signal = device.report.signalStrength;
        if (signal >= -70) ranges['Sehr gut (-60 bis -70 dBm)']++;
        else if (signal >= -85) ranges['Gut (-70 bis -85 dBm)']++;
        else if (signal >= -95) ranges['Mittel (-85 bis -95 dBm)']++;
        else ranges['Schwach (-95 bis -110 dBm)']++;
      }
    });

    return Object.entries(ranges).map(([name, value]) => ({ name, value }));
  }, [devices]);

  // Network distribution data for pie chart
  const networkData = useMemo(() => {
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

    return Object.entries(networks).map(([name, value]) => ({ name, value }));
  }, [devices]);

  // Time series data (simulated for demo)
  const timeSeriesData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = i;
      const avgSignal = -75 + Math.sin(i * 0.3) * 10 + Math.random() * 5;
      const onlineDevices = Math.max(0, devices.length - Math.floor(Math.random() * 5));
      
      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        avgSignal: Math.round(Math.abs(avgSignal)),
        onlineDevices,
        uptime: 95 + Math.random() * 5,
      };
    });
    return hours;
  }, [devices.length]);

  // Status distribution
  const statusData = useMemo(() => {
    const stats = {
      online: devices.filter(d => d.signal !== 'grey').length,
      optimal: devices.filter(d => d.signal === 'green').length,
      warning: devices.filter(d => d.signal === 'yellow').length,
      critical: devices.filter(d => d.signal === 'red').length,
      offline: devices.filter(d => d.signal === 'grey').length,
    };

    return [
      { name: 'Optimal', value: stats.optimal, color: '#10b981' },
      { name: 'Gut', value: stats.warning, color: '#f59e0b' },
      { name: 'Schwach', value: stats.critical, color: '#ef4444' },
      { name: 'Offline', value: stats.offline, color: '#6b7280' },
    ];
  }, [devices]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-4">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-[300px] bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Signal Strength Over Time */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Signalstärke über Zeit
            </CardTitle>
            <CardDescription>
              24-Stunden-Verlauf der durchschnittlichen Signalstärke
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="signalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="hour" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value) => [`${value} dBm`, 'Signalstärke']}
                  labelStyle={{ color: '#374151' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="avgSignal" 
                  stroke="#3b82f6" 
                  fillOpacity={1}
                  fill="url(#signalGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Network Distribution Pie Chart */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Network className="h-5 w-5 text-green-500" />
              Netzwerk-Verteilung
            </CardTitle>
            <CardDescription>
              Verteilung der Geräte auf verschiedene Netzwerke
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {networkData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={networkData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {networkData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Geräte`, 'Anzahl']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Network className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm">Keine Netzwerkdaten verfügbar</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution Bar Chart */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wifi className="h-5 w-5 text-purple-500" />
              Geräte-Status Verteilung
            </CardTitle>
            <CardDescription>
              Übersicht der verschiedenen Gerätezustände
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="name" type="category" fontSize={12} width={60} />
                <Tooltip formatter={(value) => [`${value} Geräte`, 'Anzahl']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Online Devices Over Time */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Online Geräte Verlauf
            </CardTitle>
            <CardDescription>
              Anzahl der online Geräte im Tagesverlauf
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="hour" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => [`${value} Geräte`, 'Online']} />
                <Line 
                  type="monotone" 
                  dataKey="onlineDevices" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  dot={{ fill: '#f97316', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Connection Stability */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Verbindungsstabilität & Performance
          </CardTitle>
          <CardDescription>
            Detaillierte Analyse der Systemleistung und Verfügbarkeit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <p className="text-xs text-green-700 mb-1">Durchschnittliche Uptime</p>
              <p className="text-3xl font-bold text-green-600">98.5%</p>
              <p className="text-xs text-green-600 mt-1">Ausgezeichnet</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-500 rounded-full mx-auto mb-3">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <p className="text-xs text-yellow-700 mb-1">Verbindungsabbrüche heute</p>
              <p className="text-3xl font-bold text-yellow-600">3</p>
              <p className="text-xs text-yellow-600 mt-1">Normal</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full mx-auto mb-3">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <p className="text-xs text-blue-700 mb-1">Längste Ausfallzeit</p>
              <p className="text-3xl font-bold text-blue-600">12 Min</p>
              <p className="text-xs text-blue-600 mt-1">Akzeptabel</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-500 rounded-full mx-auto mb-3">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <p className="text-xs text-purple-700 mb-1">Avg. Response Zeit</p>
              <p className="text-3xl font-bold text-purple-600">247ms</p>
              <p className="text-xs text-purple-600 mt-1">Sehr gut</p>
            </div>
          </div>

          {/* System Health Chart */}
          <div className="bg-muted/20 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3">System-Verfügbarkeit (24h)</h4>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" fontSize={10} />
                <YAxis domain={[90, 100]} fontSize={10} />
                <Tooltip formatter={(value) => [`${typeof value === 'number' ? value.toFixed(2) : value}%`, 'Uptime']} />
                <Area 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke="#10b981" 
                  fillOpacity={1}
                  fill="url(#uptimeGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Aktueller Systemstatus</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-medium">Alle Systeme funktional</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}