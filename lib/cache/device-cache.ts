import { Device, DeviceListResponse } from '@/lib/api/types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DeviceCache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number = 60000; // 1 minute default TTL
  private maxCacheSize: number = 100; // Maximum number of cache entries

  constructor() {
    this.cache = new Map();
    
    // Load persisted cache from localStorage if available
    if (typeof window !== 'undefined') {
      this.loadFromLocalStorage();
      
      // Save to localStorage periodically
      setInterval(() => this.saveToLocalStorage(), 30000); // Every 30 seconds
    }
  }

  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access time for LRU
    entry.timestamp = now;
    return entry.data as T;
  }

  /**
   * Set cache data with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Implement cache size limit with LRU eviction
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(key)) {
      const oldestKey = this.findOldestEntry();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('deviceCache');
    }
  }

  /**
   * Find oldest cache entry for LRU eviction
   */
  private findOldestEntry(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Save cache to localStorage for persistence
   */
  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const cacheData: Record<string, CacheEntry<any>> = {};
      
      // Only save entries that haven't expired
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp <= entry.ttl) {
          cacheData[key] = entry;
        }
      }

      localStorage.setItem('deviceCache', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save cache to localStorage:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('deviceCache');
      if (!stored) return;

      const cacheData = JSON.parse(stored) as Record<string, CacheEntry<any>>;
      const now = Date.now();

      // Load only valid entries
      for (const [key, entry] of Object.entries(cacheData)) {
        if (now - entry.timestamp <= entry.ttl) {
          this.cache.set(key, entry);
        }
      }
    } catch (error) {
      console.error('Failed to load cache from localStorage:', error);
      localStorage.removeItem('deviceCache');
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    return {
      size: this.cache.size,
      hits: 0, // Would need to track this
      misses: 0, // Would need to track this
      hitRate: 0,
    };
  }
}

// Singleton instance
export const deviceCache = new DeviceCache();

// Cache key generators
export const cacheKeys = {
  deviceList: (page: number, per: number, search?: string, signal?: string) => 
    `devices:list:${page}:${per}:${search || ''}:${signal || ''}`,
  
  deviceDetails: (id: string) => 
    `devices:details:${id}`,
  
  deviceReport: (id: string, reportId?: string) => 
    `devices:report:${id}:${reportId || 'latest'}`,
  
  allDevices: () => 
    'devices:all',
  
  statistics: () => 
    'devices:statistics',
};

// TTL configurations (in milliseconds)
export const cacheTTL = {
  deviceList: 30000,     // 30 seconds for device lists
  deviceDetails: 60000,  // 1 minute for device details
  deviceReport: 30000,   // 30 seconds for reports
  allDevices: 20000,     // 20 seconds for all devices (monitoring)
  statistics: 60000,     // 1 minute for statistics
};