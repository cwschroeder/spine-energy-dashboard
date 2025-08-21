'use client';

import type { Device } from '@/lib/api/types';

interface StaticMapProps {
  devices: Device[];
}

export function StaticMap({ devices }: StaticMapProps) {
  const devicesWithLocation = devices.filter(
    d => d.config?.location?.latitude && d.config?.location?.longitude
  );

  // Use a static map image from OpenStreetMap or create a simple visualization
  const centerLat = devicesWithLocation.length > 0
    ? devicesWithLocation.reduce((sum, d) => sum + d.config!.location!.latitude, 0) / devicesWithLocation.length
    : 51.1657;
  
  const centerLon = devicesWithLocation.length > 0
    ? devicesWithLocation.reduce((sum, d) => sum + d.config!.location!.longitude, 0) / devicesWithLocation.length
    : 10.4515;

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-lg overflow-hidden">
      {/* Static map background */}
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${centerLon-2},${centerLat-2},${centerLon+2},${centerLat+2}&layer=mapnik`}
        style={{ border: 0 }}
      />
      
      {/* Device list overlay */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-4 max-w-xs max-h-96 overflow-auto">
        <h3 className="font-semibold text-sm mb-3">Geräte mit Standort ({devicesWithLocation.length})</h3>
        <div className="space-y-2">
          {devicesWithLocation.map((device) => (
            <div key={device.device_id} className="text-xs border-l-4 pl-2 py-1" style={{
              borderColor: device.signal === 'green' ? '#10b981' :
                          device.signal === 'yellow' ? '#eab308' :
                          device.signal === 'red' ? '#ef4444' : '#9ca3af'
            }}>
              <div className="font-medium">{device.device_id}</div>
              {device.alias && <div className="text-gray-600">{device.alias}</div>}
              <div className="text-gray-500">
                {device.config?.location?.description || 
                 `${device.config?.location?.latitude?.toFixed(2)}, ${device.config?.location?.longitude?.toFixed(2)}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Sehr gut</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Gut</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Schwach</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span>Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
}