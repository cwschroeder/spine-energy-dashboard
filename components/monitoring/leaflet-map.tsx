'use client';

import { useEffect, useState } from 'react';
import L from 'leaflet';
import type { Device } from '@/lib/api/types';
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
  devices: Device[];
}

export function LeafletMap({ devices }: LeafletMapProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Initialize map
    const mapInstance = L.map('device-map', {
      center: [51.1657, 10.4515], // Germany center
      zoom: 6,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstance);

    setMap(mapInstance);

    // Cleanup
    return () => {
      mapInstance.remove();
    };
  }, []);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const devicesWithLocation = devices.filter(
      d => d.config?.location?.latitude && d.config?.location?.longitude
    );

    if (devicesWithLocation.length === 0) return;

    const markers: L.Marker[] = [];

    // Add markers for each device
    devicesWithLocation.forEach((device) => {
      const lat = device.config!.location!.latitude;
      const lng = device.config!.location!.longitude;

      // Create custom icon based on signal status
      const color = {
        green: '#10b981',
        yellow: '#eab308',
        red: '#ef4444',
        grey: '#9ca3af',
      }[device.signal] || '#9ca3af';

      const svgIcon = `
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2" opacity="0.9"/>
          <circle cx="16" cy="16" r="8" fill="white"/>
          <text x="16" y="20" text-anchor="middle" fill="${color}" font-size="12" font-weight="bold">
            ${device.signal === 'green' ? '✓' : device.signal === 'yellow' ? '!' : device.signal === 'red' ? '⚠' : '✕'}
          </text>
        </svg>
      `;

      const icon = L.divIcon({
        html: svgIcon,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        className: 'custom-div-icon',
      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; font-weight: 600;">${device.device_id}</h4>
          ${device.alias ? `<p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${device.alias}</p>` : ''}
          <div style="font-size: 13px; line-height: 1.5;">
            <div style="margin-bottom: 4px;">
              <strong>Status:</strong> 
              <span style="color: ${color}; font-weight: 500;">
                ${device.signal === 'green' ? 'Sehr gut' : 
                  device.signal === 'yellow' ? 'Gut' : 
                  device.signal === 'red' ? 'Schwach' : 'Offline'}
              </span>
            </div>
            ${device.config?.location?.description ? `
              <div style="margin-bottom: 4px;">
                <strong>Standort:</strong> ${device.config.location.description}
              </div>
            ` : ''}
            ${device.report?.signalStrength ? `
              <div style="margin-bottom: 4px;">
                <strong>Signal:</strong> ${device.report.signalStrength} dBm
              </div>
            ` : ''}
            ${device.report?.network ? `
              <div style="margin-bottom: 4px;">
                <strong>Netzwerk:</strong> ${
                  Array.isArray(device.report.network) 
                    ? device.report.network[0]?.name 
                    : device.report.network.name
                }
              </div>
            ` : ''}
            ${device.lastOnline ? `
              <div style="margin-bottom: 4px;">
                <strong>Letzter Kontakt:</strong><br/>
                ${new Date(device.lastOnline).toLocaleString('de-DE')}
              </div>
            ` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      
      // Open popup on click
      marker.on('click', () => {
        setSelectedDevice(device);
      });

      markers.push(marker);
    });

    // Fit map to show all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [map, devices]);

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

  return (
    <div className="flex h-full">
      {/* Map Container */}
      <div className="flex-1 relative">
        <div id="device-map" className="w-full h-full" />
        
        {/* Map Controls Overlay */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 z-[1000]">
          <div className="text-xs space-y-1">
            <div className="font-semibold mb-2">Legende</div>
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
      </div>

      {/* Device List Sidebar */}
      <div className="w-80 bg-white border-l overflow-auto">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-sm">
            Gerätestandorte
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {devicesWithLocation.length} von {devices.length} Geräten mit Standort
          </p>
        </div>

        <div className="p-4">
          {/* Devices with location */}
          {devicesWithLocation.length > 0 && (
            <div className="space-y-2 mb-4">
              {devicesWithLocation.map((device) => (
                <div
                  key={device.device_id}
                  className={`p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedDevice?.device_id === device.device_id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (map && device.config?.location) {
                      map.setView(
                        [device.config.location.latitude, device.config.location.longitude],
                        14
                      );
                      // Find and open the marker popup
                      map.eachLayer((layer) => {
                        if (layer instanceof L.Marker) {
                          const latLng = layer.getLatLng();
                          if (
                            device.config.location &&
                            Math.abs(latLng.lat - device.config.location.latitude) < 0.0001 &&
                            Math.abs(latLng.lng - device.config.location.longitude) < 0.0001
                          ) {
                            layer.openPopup();
                          }
                        }
                      });
                    }
                    setSelectedDevice(device);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getMarkerColor(device.signal) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{device.device_id}</div>
                      {device.alias && device.alias.trim() !== '' && (
                        <div className="text-xs text-gray-600 truncate">{device.alias}</div>
                      )}
                      <div className="text-xs text-gray-500 truncate">
                        {device.config?.location?.description || 
                         `${device.config?.location?.latitude?.toFixed(4)}, ${device.config?.location?.longitude?.toFixed(4)}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Devices without location */}
          {devicesWithoutLocation.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-2">
                Ohne Standortdaten ({devicesWithoutLocation.length})
              </h4>
              <div className="space-y-1">
                {devicesWithoutLocation.map((device) => (
                  <div
                    key={device.device_id}
                    className="p-2 rounded bg-gray-50 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getMarkerColor(device.signal) }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">{device.device_id}</span>
                        {device.alias && device.alias.trim() !== '' && (
                          <span className="text-gray-600 truncate block text-xs">{device.alias}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}