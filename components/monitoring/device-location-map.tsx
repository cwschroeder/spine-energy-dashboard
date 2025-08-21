'use client';

import { useState } from 'react';
import type { Device } from '@/lib/api/types';
import { MapPin, Wifi, WifiOff } from 'lucide-react';

interface DeviceLocationMapProps {
  devices: Device[];
}

export function DeviceLocationMap({ devices }: DeviceLocationMapProps) {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [mapView, setMapView] = useState<'germany' | 'munich' | 'ingolstadt'>('germany');

  const devicesWithLocation = devices.filter(
    d => d.config?.location?.latitude && d.config?.location?.longitude
  );

  const devicesWithoutLocation = devices.filter(
    d => !d.config?.location?.latitude || !d.config?.location?.longitude
  );

  const getMarkerColor = (signal: string) => {
    switch (signal) {
      case 'green': return '#10b981';
      case 'yellow': return '#eab308';
      case 'red': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const getStatusLabel = (signal: string) => {
    switch (signal) {
      case 'green': return 'Sehr gut';
      case 'yellow': return 'Gut';
      case 'red': return 'Schwach';
      default: return 'Offline';
    }
  };

  // Group devices by location area
  const munichDevices = devicesWithLocation.filter(d => {
    const lat = d.config!.location!.latitude;
    const lng = d.config!.location!.longitude;
    return lat >= 48.0 && lat <= 48.3 && lng >= 11.4 && lng <= 11.7;
  });

  const ingolstadtDevices = devicesWithLocation.filter(d => {
    const lat = d.config!.location!.latitude;
    const lng = d.config!.location!.longitude;
    return lat >= 48.7 && lat <= 48.9 && lng >= 11.3 && lng <= 11.5;
  });

  const otherDevices = devicesWithLocation.filter(d => 
    !munichDevices.includes(d) && !ingolstadtDevices.includes(d)
  );

  // Generate static map image URL with markers
  const generateStaticMapUrl = () => {
    let center = '51.1657,10.4515';
    let zoom = '6';
    
    if (mapView === 'munich') {
      center = '48.1351,11.5820';
      zoom = '12';
    } else if (mapView === 'ingolstadt') {
      center = '48.7665,11.4257';
      zoom = '12';
    }

    // For demonstration, we'll show a static OSM export
    // In production, you'd use a service like MapBox Static API or similar
    const bbox = mapView === 'germany' 
      ? '5.8,47.2,15.0,55.0'
      : mapView === 'munich'
      ? '11.4,48.0,11.7,48.3'
      : '11.3,48.7,11.5,48.9';

    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
  };

  return (
    <div className="flex h-full">
      {/* Left side - Device List */}
      <div className="w-1/3 bg-white border-r overflow-auto">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-sm mb-2">
            Gerätestandorte ({devicesWithLocation.length} von {devices.length})
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setMapView('germany')}
              className={`px-3 py-1 text-xs rounded ${
                mapView === 'germany' ? 'bg-primary text-white' : 'bg-gray-200'
              }`}
            >
              Deutschland
            </button>
            <button
              onClick={() => setMapView('munich')}
              className={`px-3 py-1 text-xs rounded ${
                mapView === 'munich' ? 'bg-primary text-white' : 'bg-gray-200'
              }`}
            >
              München ({munichDevices.length})
            </button>
            <button
              onClick={() => setMapView('ingolstadt')}
              className={`px-3 py-1 text-xs rounded ${
                mapView === 'ingolstadt' ? 'bg-primary text-white' : 'bg-gray-200'
              }`}
            >
              Ingolstadt ({ingolstadtDevices.length})
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Devices with location */}
          <div>
            <h4 className="text-xs font-semibold text-gray-600 mb-2">Mit Standort</h4>
            <div className="space-y-2">
              {devicesWithLocation.map((device) => (
                <div
                  key={device.device_id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedDevice?.device_id === device.device_id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDevice(device)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getMarkerColor(device.signal) }}
                        />
                        <span className="font-medium text-sm">{device.device_id}</span>
                      </div>
                      {device.alias && (
                        <div className="text-xs text-gray-600 mt-1">{device.alias}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {device.config?.location?.description || 
                         `${device.config?.location?.latitude?.toFixed(4)}, ${device.config?.location?.longitude?.toFixed(4)}`}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs font-medium ${
                          device.signal === 'green' ? 'text-green-600' :
                          device.signal === 'yellow' ? 'text-yellow-600' :
                          device.signal === 'red' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {getStatusLabel(device.signal)}
                        </span>
                        {device.report?.signalStrength && (
                          <span className="text-xs text-gray-500">
                            {device.report.signalStrength} dBm
                          </span>
                        )}
                      </div>
                    </div>
                    {device.signal === 'grey' ? (
                      <WifiOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Wifi className="h-4 w-4" style={{ color: getMarkerColor(device.signal) }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Devices without location */}
          {devicesWithoutLocation.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-2">
                Ohne Standort ({devicesWithoutLocation.length})
              </h4>
              <div className="space-y-2">
                {devicesWithoutLocation.map((device) => (
                  <div
                    key={device.device_id}
                    className="p-2 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getMarkerColor(device.signal) }}
                        />
                        <span className="text-sm">{device.device_id}</span>
                      </div>
                      <span className={`text-xs ${
                        device.signal === 'green' ? 'text-green-600' :
                        device.signal === 'yellow' ? 'text-yellow-600' :
                        device.signal === 'red' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {getStatusLabel(device.signal)}
                      </span>
                    </div>
                    {device.alias && (
                      <div className="text-xs text-gray-600 mt-1">{device.alias}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Map and Details */}
      <div className="flex-1 relative bg-gray-100">
        {/* Map */}
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={generateStaticMapUrl()}
          style={{ border: 0 }}
          title="Device Map"
        />

        {/* Location Summary Overlay */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-4">
          <h4 className="font-semibold text-sm mb-3">Standort-Übersicht</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span>München:</span>
              <span className="font-medium">{munichDevices.length} Geräte</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Ingolstadt:</span>
              <span className="font-medium">{ingolstadtDevices.length} Geräte</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Andere:</span>
              <span className="font-medium">{otherDevices.length} Geräte</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Sehr gut: {devices.filter(d => d.signal === 'green').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Gut: {devices.filter(d => d.signal === 'yellow').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Schwach: {devices.filter(d => d.signal === 'red').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span>Offline: {devices.filter(d => d.signal === 'grey').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Device Details */}
        {selectedDevice && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-xl p-4 max-w-sm">
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
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Status:</span>{' '}
                <span className={`font-medium ${
                  selectedDevice.signal === 'green' ? 'text-green-600' :
                  selectedDevice.signal === 'yellow' ? 'text-yellow-600' :
                  selectedDevice.signal === 'red' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {getStatusLabel(selectedDevice.signal)}
                </span>
              </div>
              {selectedDevice.config?.location?.description && (
                <div>
                  <span className="text-gray-500">Standort:</span>{' '}
                  {selectedDevice.config.location.description}
                </div>
              )}
              {selectedDevice.report?.signalStrength && (
                <div>
                  <span className="text-gray-500">Signalstärke:</span>{' '}
                  {selectedDevice.report.signalStrength} dBm
                </div>
              )}
              {selectedDevice.lastOnline && (
                <div>
                  <span className="text-gray-500">Letzter Kontakt:</span>{' '}
                  {new Date(selectedDevice.lastOnline).toLocaleString('de-DE')}
                </div>
              )}
              {selectedDevice.report?.network && (
                <div>
                  <span className="text-gray-500">Netzwerk:</span>{' '}
                  {Array.isArray(selectedDevice.report.network)
                    ? selectedDevice.report.network[0]?.name
                    : selectedDevice.report.network.name}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}