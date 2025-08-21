'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { Device } from '@/lib/api/types';

const LeafletMap = dynamic(
  () => import('./leaflet-map-optimized').then(mod => mod.LeafletMapOptimized),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Skeleton className="h-96 w-full" />
          <p className="text-sm text-muted-foreground mt-4">Karte wird geladen...</p>
        </div>
      </div>
    ),
  }
);

interface DynamicLeafletMapProps {
  devices: Device[];
}

export function DynamicLeafletMap({ devices }: DynamicLeafletMapProps) {
  return <LeafletMap devices={devices} />;
}