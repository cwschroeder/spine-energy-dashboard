'use client';

import { useQuery } from '@tanstack/react-query';
import { spineApi } from '@/lib/api/client';
import { deviceCache, cacheKeys, cacheTTL } from '@/lib/cache/device-cache';
import type { DeviceDetails } from '@/lib/api/types';

export interface EnhancedMetrics {
  serviceHealth: unknown;
  serviceVersion: unknown;
  serviceName: unknown;
}

// Hook for enhanced service metrics
export function useServiceMetrics() {
  const { data: health, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['service-health'],
    queryFn: async () => {
      const cacheKey = cacheKeys.generic('service-health');
      
      const cached = deviceCache.get(cacheKey);
      if (cached) {
        console.log('[Cache HIT] Service health from cache');
        return cached;
      }
      
      console.log('[Cache MISS] Fetching service health from API');
      const data = await spineApi.getServiceHealth();
      
      deviceCache.set(cacheKey, data, 60000); // 1 minute cache
      return data;
    },
    refetchInterval: 60000,
    retry: 2,
  });

  const { data: version } = useQuery({
    queryKey: ['service-version'],
    queryFn: async () => {
      const cacheKey = cacheKeys.generic('service-version');
      
      const cached = deviceCache.get(cacheKey);
      if (cached) return cached;
      
      const data = await spineApi.getServiceVersion();
      deviceCache.set(cacheKey, data, 300000); // 5 minutes cache
      return data;
    },
    staleTime: 300000,
  });

  const { data: serviceName } = useQuery({
    queryKey: ['service-name'],
    queryFn: async () => {
      const cacheKey = cacheKeys.generic('service-name');
      
      const cached = deviceCache.get(cacheKey);
      if (cached) return cached;
      
      const data = await spineApi.getServiceName();
      deviceCache.set(cacheKey, data, 300000); // 5 minutes cache
      return data;
    },
    staleTime: 300000,
  });

  return {
    health,
    version,
    serviceName,
    healthLoading,
    healthError,
    isHealthy: !healthError && health,
  };
}

// Hook for device performance metrics
export function useDevicePerformanceMetrics(deviceId: string) {
  return useQuery<DeviceDetails & { performanceScore?: number }, Error>({
    queryKey: ['device-performance', deviceId],
    queryFn: async () => {
      const cacheKey = cacheKeys.deviceDetails(deviceId);
      
      const cached = deviceCache.get<DeviceDetails>(cacheKey);
      if (cached) {
        console.log(`[Cache HIT] Performance metrics for ${deviceId}`);
        // Calculate performance score based on available metrics
        const performanceScore = calculatePerformanceScore(cached);
        return { ...cached, performanceScore };
      }
      
      console.log(`[Cache MISS] Fetching performance metrics for ${deviceId}`);
      const data = await spineApi.getDeviceDetails(deviceId);
      
      // Calculate performance score
      const performanceScore = calculatePerformanceScore(data);
      const enrichedData = { ...data, performanceScore };
      
      deviceCache.set(cacheKey, enrichedData, cacheTTL.deviceDetails);
      return enrichedData;
    },
    enabled: !!deviceId,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

// Calculate a performance score based on various metrics
function calculatePerformanceScore(device: DeviceDetails): number {
  let score = 100;
  
  // Signal strength penalty
  if (device.report?.signalStrength) {
    if (device.report.signalStrength < -80) score -= 20;
    else if (device.report.signalStrength < -70) score -= 10;
    else if (device.report.signalStrength < -60) score -= 5;
  }
  
  // SNR penalty
  if (device.report?.snr !== undefined) {
    if (device.report.snr < 7) score -= 15;
    else if (device.report.snr < 13) score -= 8;
    else if (device.report.snr < 20) score -= 3;
  }
  
  // Success rate penalty
  if (device.report?.percentSuccess !== undefined) {
    if (device.report.percentSuccess < 70) score -= 25;
    else if (device.report.percentSuccess < 85) score -= 15;
    else if (device.report.percentSuccess < 95) score -= 5;
  }
  
  // Reconnects penalty
  if (device.report?.reconnects !== undefined) {
    if (device.report.reconnects > 20) score -= 20;
    else if (device.report.reconnects > 10) score -= 10;
    else if (device.report.reconnects > 5) score -= 5;
  }
  
  // Link quality bonus/penalty
  if (device.report?.linkQuality !== undefined) {
    if (device.report.linkQuality > 80) score += 5;
    else if (device.report.linkQuality < 30) score -= 10;
    else if (device.report.linkQuality < 50) score -= 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

// Hook for aggregated network metrics
export function useNetworkMetrics(devices: any[]) {
  return useQuery({
    queryKey: ['network-metrics', devices.length],
    queryFn: () => {
      const devicesWithNetwork = devices.filter(d => 
        d.report && (d.report.cellId || d.report.lac || d.report.smcc || d.report.smnc)
      );

      // Group by operator (MCC/MNC)
      const operators = devicesWithNetwork.reduce((acc, device) => {
        if (device.report?.smcc && device.report?.smnc) {
          const key = `${device.report.smcc}-${device.report.smnc}`;
          if (!acc[key]) {
            acc[key] = {
              mcc: device.report.smcc,
              mnc: device.report.smnc,
              devices: [],
              avgSignal: 0,
              avgSNR: 0,
              avgSuccess: 0,
            };
          }
          acc[key].devices.push(device);
        }
        return acc;
      }, {});

      // Calculate averages for each operator
      Object.values(operators).forEach((op: any) => {
        const signals = op.devices.filter(d => d.report?.signalStrength).map(d => d.report.signalStrength);
        const snrs = op.devices.filter(d => d.report?.snr !== undefined).map(d => d.report.snr);
        const success = op.devices.filter(d => d.report?.percentSuccess !== undefined).map(d => d.report.percentSuccess);
        
        op.avgSignal = signals.length > 0 ? signals.reduce((a, b) => a + b, 0) / signals.length : 0;
        op.avgSNR = snrs.length > 0 ? snrs.reduce((a, b) => a + b, 0) / snrs.length : 0;
        op.avgSuccess = success.length > 0 ? success.reduce((a, b) => a + b, 0) / success.length : 0;
      });

      // Group by cell tower
      const cellTowers = devicesWithNetwork.reduce((acc, device) => {
        if (device.report?.cellId && device.report?.lac) {
          const key = `${device.report.cellId}-${device.report.lac}`;
          if (!acc[key]) {
            acc[key] = {
              cellId: device.report.cellId,
              lac: device.report.lac,
              devices: [],
              coverage: 0,
            };
          }
          acc[key].devices.push(device);
        }
        return acc;
      }, {});

      // Calculate coverage for each cell tower
      Object.values(cellTowers).forEach((tower: any) => {
        tower.coverage = (tower.devices.length / devicesWithNetwork.length) * 100;
      });

      return {
        operators,
        cellTowers,
        totalDevicesWithNetwork: devicesWithNetwork.length,
        operatorCount: Object.keys(operators).length,
        cellTowerCount: Object.keys(cellTowers).length,
      };
    },
    enabled: devices.length > 0,
    staleTime: 30000,
  });
}