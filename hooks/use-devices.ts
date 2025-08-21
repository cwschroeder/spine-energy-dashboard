'use client';

import { useQuery } from '@tanstack/react-query';
import { spineApi } from '@/lib/api/client';
import type { DeviceListResponse } from '@/lib/api/types';
import { deviceCache, cacheKeys, cacheTTL } from '@/lib/cache/device-cache';

export function useDevices(page: number = 1, per: number = 50) {
  return useQuery<DeviceListResponse, Error>({
    queryKey: ['devices', page, per],
    queryFn: async () => {
      const cacheKey = cacheKeys.deviceList(page, per);
      
      // Check cache first
      const cached = deviceCache.get<DeviceListResponse>(cacheKey);
      if (cached) {
        console.log('[Cache HIT] Device list from cache');
        return cached;
      }
      
      console.log('[Cache MISS] Fetching device list from API');
      const data = await spineApi.getDeviceList(page, per);
      
      // Store in cache
      deviceCache.set(cacheKey, data, cacheTTL.deviceList);
      
      return data;
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useDeviceDetails(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId],
    queryFn: async () => {
      const cacheKey = cacheKeys.deviceDetails(deviceId);
      
      // Check cache first
      const cached = deviceCache.get(cacheKey);
      if (cached) {
        console.log(`[Cache HIT] Device details for ${deviceId}`);
        return cached;
      }
      
      console.log(`[Cache MISS] Fetching device details for ${deviceId}`);
      const data = await spineApi.getDeviceDetails(deviceId);
      
      // Store in cache
      deviceCache.set(cacheKey, data, cacheTTL.deviceDetails);
      
      return data;
    },
    enabled: !!deviceId,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useLiveData(deviceId: string, enabled: boolean = false) {
  return useQuery({
    queryKey: ['live', deviceId],
    queryFn: async () => {
      const cacheKey = cacheKeys.deviceReport(deviceId);
      
      // For live data, use shorter cache TTL
      const cached = deviceCache.get(cacheKey);
      if (cached) {
        console.log(`[Cache HIT] Live data for ${deviceId}`);
        return cached;
      }
      
      console.log(`[Cache MISS] Fetching live data for ${deviceId}`);
      const data = await spineApi.getLiveData(deviceId);
      
      // Store with shorter TTL for live data
      deviceCache.set(cacheKey, data, 5000); // 5 seconds for live data
      
      return data;
    },
    enabled: !!deviceId && enabled,
    refetchInterval: 5000,
  });
}

// Hook to manually invalidate cache
export function useInvalidateCache() {
  return {
    invalidateAll: () => {
      deviceCache.clear();
      console.log('[Cache] Cleared all cache entries');
    },
    invalidateDevice: (deviceId: string) => {
      deviceCache.invalidate(cacheKeys.deviceDetails(deviceId));
      deviceCache.invalidate(cacheKeys.deviceReport(deviceId));
      console.log(`[Cache] Invalidated cache for device ${deviceId}`);
    },
    invalidateDeviceList: () => {
      deviceCache.invalidatePattern('devices:list:.*');
      console.log('[Cache] Invalidated all device lists');
    },
  };
}