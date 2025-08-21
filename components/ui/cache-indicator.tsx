'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { deviceCache } from '@/lib/cache/device-cache';
import { useInvalidateCache } from '@/hooks/use-devices';
import { Database, Trash2, Activity } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function CacheIndicator() {
  const [cacheSize, setCacheSize] = useState(0);
  const [lastHit, setLastHit] = useState<'hit' | 'miss' | null>(null);
  const { invalidateAll } = useInvalidateCache();

  useEffect(() => {
    // Update cache size periodically
    const interval = setInterval(() => {
      const stats = deviceCache.getStats();
      setCacheSize(stats.size);
    }, 2000);

    // Listen for console logs to detect cache hits/misses
    const originalLog = console.log;
    console.log = function(...args) {
      originalLog.apply(console, args);
      const message = args[0];
      if (typeof message === 'string') {
        if (message.includes('[Cache HIT]')) {
          setLastHit('hit');
          setTimeout(() => setLastHit(null), 2000);
        } else if (message.includes('[Cache MISS]')) {
          setLastHit('miss');
          setTimeout(() => setLastHit(null), 2000);
        }
      }
    };

    return () => {
      clearInterval(interval);
      console.log = originalLog;
    };
  }, []);

  const handleClearCache = () => {
    invalidateAll();
    setCacheSize(0);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Cache Status Indicator */}
        <div className="flex items-center gap-1.5">
          <Database className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs">
            {cacheSize} cached
          </Badge>
          
          {/* Hit/Miss Indicator */}
          {lastHit && (
            <Badge 
              variant={lastHit === 'hit' ? 'default' : 'destructive'}
              className="text-xs animate-pulse"
            >
              {lastHit === 'hit' ? (
                <>
                  <Activity className="h-3 w-3 mr-1" />
                  HIT
                </>
              ) : (
                <>
                  <Activity className="h-3 w-3 mr-1" />
                  MISS
                </>
              )}
            </Badge>
          )}
        </div>

        {/* Clear Cache Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleClearCache}
              disabled={cacheSize === 0}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cache leeren</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}