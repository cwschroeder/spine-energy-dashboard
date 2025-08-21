'use client';

import { useEffect, useState } from 'react';
import type { Device } from '@/lib/api/types';

interface InteractiveMapProps {
  devices: Device[];
}

export function InteractiveMap({ devices }: InteractiveMapProps) {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const devicesWithLocation = devices.filter(
    d => d.config?.location?.latitude && d.config?.location?.longitude
  );

  // Calculate center and zoom based on devices
  const calculateBounds = () => {
    if (devicesWithLocation.length === 0) {
      return { center: { lat: 51.1657, lng: 10.4515 }, zoom: 6 };
    }

    const lats = devicesWithLocation.map(d => d.config!.location!.latitude);
    const lngs = devicesWithLocation.map(d => d.config!.location!.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Calculate appropriate zoom level
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 6;
    if (maxDiff < 0.5) zoom = 10;
    else if (maxDiff < 1) zoom = 9;
    else if (maxDiff < 2) zoom = 8;
    else if (maxDiff < 5) zoom = 7;
    
    return { center: { lat: centerLat, lng: centerLng }, zoom };
  };

  const { center, zoom } = calculateBounds();

  const getMarkerColor = (signal: string) => {
    switch (signal) {
      case 'green': return '#10b981';
      case 'yellow': return '#eab308';
      case 'red': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const getMarkerSymbol = (signal: string) => {
    switch (signal) {
      case 'green': return '✓';
      case 'yellow': return '!';
      case 'red': return '⚠';
      default: return '✕';
    }
  };

  // Generate map URL with markers
  const generateMapUrl = () => {
    const baseUrl = 'https://www.openstreetmap.org/export/embed.html';
    const bbox = `${center.lng - 3},${center.lat - 2},${center.lng + 3},${center.lat + 2}`;
    return `${baseUrl}?bbox=${bbox}&layer=mapnik`;
  };

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-lg overflow-hidden">
      {/* OpenStreetMap iframe */}
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={generateMapUrl()}
        style={{ border: 0 }}
        title="Device Map"
      />
      
      {/* Overlay with device markers as absolutely positioned elements */}
      <div className="absolute inset-0 pointer-events-none">
        {devicesWithLocation.map((device) => {
          // Convert lat/lng to approximate pixel positions
          // This is a simplified calculation - in production you'd use proper map projection
          const relLat = ((center.lat - device.config!.location!.latitude) / 6 + 0.5);
          const relLng = ((device.config!.location!.longitude - center.lng) / 6 + 0.5);
          
          const top = `${relLat * 100}%`;
          const left = `${relLng * 100}%`;
          
          return (
            <div
              key={device.device_id}
              className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
              style={{ top, left }}
              onClick={() => setSelectedDevice(device)}
            >
              <div 
                className="relative group"
              >
                {/* Marker */}
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-transform hover:scale-110"
                  style={{ backgroundColor: getMarkerColor(device.signal) }}
                >
                  {getMarkerSymbol(device.signal)}
                </div>
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {device.device_id}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Device list sidebar */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-4 max-w-xs max-h-[calc(100%-2rem)] overflow-auto">
        <h3 className="font-semibold text-sm mb-3">
          Geräte mit Standort ({devicesWithLocation.length} von {devices.length})
        </h3>
        
        {devicesWithLocation.length === 0 ? (
          <p className="text-xs text-gray-500">Keine Geräte mit Standortdaten gefunden</p>
        ) : (
          <div className="space-y-2">
            {devicesWithLocation.map((device) => (
              <div 
                key={device.device_id} 
                className={`text-xs border-l-4 pl-2 py-1 cursor-pointer hover:bg-gray-50 rounded-r ${
                  selectedDevice?.device_id === device.device_id ? 'bg-gray-50' : ''
                }`}
                style={{
                  borderColor: getMarkerColor(device.signal)
                }}
                onClick={() => setSelectedDevice(device)}
              >
                <div className="font-medium">{device.device_id}</div>
                {device.alias && <div className="text-gray-600">{device.alias}</div>}
                <div className="text-gray-500">
                  {device.config?.location?.description || 
                   `${device.config?.location?.latitude?.toFixed(4)}, ${device.config?.location?.longitude?.toFixed(4)}`}
                </div>
                {device.report?.signalStrength && (
                  <div className="text-gray-500">
                    Signal: {device.report.signalStrength} dBm
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {devices.length > devicesWithLocation.length && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500">
              {devices.length - devicesWithLocation.length} Geräte ohne Standortdaten
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Sehr gut ({devices.filter(d => d.signal === 'green').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Gut ({devices.filter(d => d.signal === 'yellow').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Schwach ({devices.filter(d => d.signal === 'red').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span>Offline ({devices.filter(d => d.signal === 'grey').length})</span>
          </div>
        </div>
      </div>

      {/* Selected device details popup */}
      {selectedDevice && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-4 z-10 min-w-[250px]">
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            onClick={() => setSelectedDevice(null)}
          >
            ✕
          </button>
          <h4 className="font-semibold mb-2">{selectedDevice.device_id}</h4>
          {selectedDevice.alias && (
            <p className="text-sm text-gray-600 mb-2">{selectedDevice.alias}</p>
          )}
          <div className="space-y-1 text-xs">
            <div>
              <span className="font-medium">Status:</span>{' '}
              <span className={`font-medium ${
                selectedDevice.signal === 'green' ? 'text-green-500' :
                selectedDevice.signal === 'yellow' ? 'text-yellow-500' :
                selectedDevice.signal === 'red' ? 'text-red-500' : 'text-gray-500'
              }`}>
                {selectedDevice.signal === 'green' ? 'Sehr gut' :
                 selectedDevice.signal === 'yellow' ? 'Gut' :
                 selectedDevice.signal === 'red' ? 'Schwach' : 'Offline'}
              </span>
            </div>
            {selectedDevice.config?.location?.description && (
              <div>
                <span className="font-medium">Standort:</span>{' '}
                {selectedDevice.config.location.description}
              </div>
            )}
            {selectedDevice.report?.signalStrength && (
              <div>
                <span className="font-medium">Signalstärke:</span>{' '}
                {selectedDevice.report.signalStrength} dBm
              </div>
            )}
            {selectedDevice.lastOnline && (
              <div>
                <span className="font-medium">Letzter Kontakt:</span>{' '}
                {new Date(selectedDevice.lastOnline).toLocaleString('de-DE')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}