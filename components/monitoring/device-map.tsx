'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Device } from '@/lib/api/types';
import { SignalIndicator } from '@/components/devices/signal-indicator';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import 'leaflet/dist/leaflet.css';
import './leaflet-fix.css';

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface DeviceMapProps {
  devices: Device[];
}

function MapBounds({ devices }: { devices: Device[] }) {
  const map = useMap();

  useEffect(() => {
    if (devices.length === 0) return;

    const validLocations = devices
      .filter(d => d.config?.location?.latitude && d.config?.location?.longitude)
      .map(d => [d.config!.location!.latitude, d.config!.location!.longitude] as [number, number]);

    if (validLocations.length > 0) {
      const bounds = new L.LatLngBounds(validLocations);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [devices, map]);

  return null;
}

export function DeviceMap({ devices }: DeviceMapProps) {
  const getMarkerIcon = (signal: string) => {
    const colors: Record<string, string> = {
      green: '#10b981',
      yellow: '#eab308',
      red: '#ef4444',
      grey: '#9ca3af'
    };

    const svgIcon = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${colors[signal] || colors.grey}" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    `;

    return new L.Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  const devicesWithLocation = devices.filter(
    d => d.config?.location?.latitude && d.config?.location?.longitude
  );

  const defaultCenter: [number, number] = [51.1657, 10.4515]; // Deutschland Mitte

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: de });
    } catch {
      return 'N/A';
    }
  };

  return (
    <MapContainer
      center={defaultCenter}
      zoom={6}
      style={{ height: '100%', width: '100%', minHeight: '400px' }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBounds devices={devicesWithLocation} />
      {devicesWithLocation.map((device) => (
        <Marker
          key={device.device_id}
          position={[
            device.config!.location!.latitude,
            device.config!.location!.longitude,
          ]}
          icon={getMarkerIcon(device.signal)}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h4 className="font-semibold text-sm mb-2">{device.device_id}</h4>
              {device.alias && (
                <p className="text-xs text-gray-600 mb-2">{device.alias}</p>
              )}
              <div className="space-y-1">
                <SignalIndicator 
                  signal={device.signal} 
                  signalStrength={device.report?.signalStrength}
                  className="scale-90"
                />
                <p className="text-xs">
                  <span className="font-medium">Standort:</span><br />
                  {device.config?.location?.description || 'Unbekannt'}
                </p>
                <p className="text-xs">
                  <span className="font-medium">Letzter Kontakt:</span><br />
                  {formatDate(device.lastOnline)}
                </p>
                {device.report?.network && (
                  <p className="text-xs">
                    <span className="font-medium">Netzwerk:</span>{' '}
                    {Array.isArray(device.report.network) 
                      ? device.report.network[0]?.name 
                      : device.report.network.name}
                  </p>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}