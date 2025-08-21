'use client';

import { useEffect, useState } from 'react';
import L from 'leaflet';
import type { Device } from '@/lib/api/types';
import 'leaflet/dist/leaflet.css';
import { Activity, MapPin, Wifi, WifiOff } from 'lucide-react';

interface LeafletMapProps {
  devices: Device[];
}

export function LeafletMapOptimized({ devices }: LeafletMapProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mapInstance = L.map('device-map', {
      center: [51.1657, 10.4515],
      zoom: 6,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstance);

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, []);

  useEffect(() => {
    if (!map) return;

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

    devicesWithLocation.forEach((device) => {
      const lat = device.config!.location!.latitude;
      const lng = device.config!.location!.longitude;

      const color = {
        green: '#10b981',
        yellow: '#eab308',
        red: '#ef4444',
        grey: '#9ca3af',
      }[device.signal] || '#9ca3af';

      const svgIcon = `
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2" opacity="0.9"/>
          <circle cx="12" cy="12" r="5" fill="white"/>
        </svg>
      `;

      const icon = L.divIcon({
        html: svgIcon,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24],
        className: 'custom-div-icon',
      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);

      const popupContent = `
        <div style="min-width: 180px;">
          <h4 style="margin: 0 0 6px 0; font-weight: 600; font-size: 14px;">${device.device_id}</h4>
          ${device.alias ? `<p style="margin: 0 0 6px 0; color: #666; font-size: 12px;">${device.alias}</p>` : ''}
          <div style="font-size: 12px; line-height: 1.4;">
            <div style="margin-bottom: 3px;">
              <strong>Status:</strong> 
              <span style="color: ${color}; font-weight: 500;">
                ${device.signal === 'green' ? 'Sehr gut' : 
                  device.signal === 'yellow' ? 'Gut' : 
                  device.signal === 'red' ? 'Schwach' : 'Offline'}
              </span>
            </div>
            ${device.report?.signalStrength ? `
              <div style="margin-bottom: 3px;">
                <strong>Signal:</strong> ${device.report.signalStrength} dBm
              </div>
            ` : ''}
            ${device.lastOnline ? `
              <div style="margin-bottom: 3px;">
                <strong>Zuletzt online:</strong><br/>
                ${new Date(device.lastOnline).toLocaleString('de-DE', { 
                  dateStyle: 'short', 
                  timeStyle: 'short' 
                })}
              </div>
            ` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setSelectedDevice(device);
      });

      markers.push(marker);
    });

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

  const getStatusIcon = (signal: string) => {
    const color = {
      green: 'text-green-500',
      yellow: 'text-yellow-500',
      red: 'text-red-500',
      grey: 'text-gray-400',
    }[signal] || 'text-gray-400';

    return signal === 'grey' ? 
      <WifiOff className={`w-3 h-3 ${color}`} /> : 
      <Wifi className={`w-3 h-3 ${color}`} />;
  };

  const getStatusColor = (signal: string) => {
    switch (signal) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  // Performance graph data
  const performanceData = devices.reduce((acc, device) => {
    const signal = device.signal || 'grey';
    acc[signal] = (acc[signal] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxCount = Math.max(...Object.values(performanceData), 1);

  return (
    <div className="flex h-full">
      {/* Map Container */}
      <div className="flex-1 relative">
        <div id="device-map" className="w-full h-full" />
        
        {/* Compact Legend */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-md shadow-md p-2 z-[1000]">
          <div className="text-xs space-y-0.5">
            <div className="font-semibold mb-1 text-gray-700">Status</div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">Optimal ({performanceData.green || 0})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-gray-600">Gut ({performanceData.yellow || 0})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-600">Schwach ({performanceData.red || 0})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-gray-600">Offline ({performanceData.grey || 0})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Optimized Sidebar */}
      <div className="w-72 bg-white border-l flex flex-col">
        {/* Header */}
        <div className="px-3 py-2.5 border-b bg-gray-50/50">
          <h3 className="font-semibold text-sm flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Geräteübersicht
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {devicesWithLocation.length}/{devices.length} mit Standort
          </p>
        </div>

        {/* Performance Graph - Compact */}
        <div className="px-3 py-2 border-b bg-white">
          <div className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            System Performance
          </div>
          <div className="space-y-1">
            {[
              { key: 'green', label: 'Optimal', color: 'bg-green-500' },
              { key: 'yellow', label: 'Gut', color: 'bg-yellow-500' },
              { key: 'red', label: 'Schwach', color: 'bg-red-500' },
              { key: 'grey', label: 'Offline', color: 'bg-gray-400' }
            ].map(({ key, label, color }) => {
              const count = performanceData[key] || 0;
              const percentage = (count / devices.length) * 100;
              return (
                <div key={key} className="flex items-center gap-2">
                  <div className="text-xs text-gray-600 w-12">{label}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 relative overflow-hidden">
                    <div 
                      className={`${color} h-full rounded-full transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-gray-700">
                      {count > 0 && `${count} (${Math.round(percentage)}%)`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device List - Compact */}
        <div className="flex-1 overflow-auto">
          <div className="p-2 space-y-1.5">
            {/* Devices with location */}
            {devicesWithLocation.length > 0 && (
              <>
                <div className="text-xs font-medium text-gray-500 px-1 py-0.5">
                  Mit Standort
                </div>
                {devicesWithLocation.map((device) => {
                  const hasAlias = device.alias && device.alias.trim() !== '' && device.alias !== 'null';
                  
                  return (
                    <div
                      key={device.device_id}
                      className={`px-2 py-1.5 rounded border text-xs cursor-pointer transition-all hover:shadow-sm ${
                        selectedDevice?.device_id === device.device_id
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => {
                        if (map && device.config?.location) {
                          map.setView(
                            [device.config.location.latitude, device.config.location.longitude],
                            14
                          );
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
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(device.signal)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {device.device_id}
                          </div>
                          {hasAlias && (
                            <div className="text-[10px] text-gray-500 truncate">
                              {device.alias}
                            </div>
                          )}
                        </div>
                        {device.report?.signalStrength && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            {device.report.signalStrength}dBm
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Devices without location */}
            {devicesWithoutLocation.length > 0 && (
              <>
                <div className="text-xs font-medium text-gray-500 px-1 py-0.5 mt-2">
                  Ohne Standort ({devicesWithoutLocation.length})
                </div>
                {devicesWithoutLocation.map((device) => {
                  const hasAlias = device.alias && device.alias.trim() !== '' && device.alias !== 'null';
                  
                  return (
                    <div
                      key={device.device_id}
                      className="px-2 py-1 rounded bg-gray-50 text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(device.signal)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-700 truncate">
                            {device.device_id}
                          </div>
                          {hasAlias && (
                            <div className="text-[10px] text-gray-500 truncate">
                              {device.alias}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}