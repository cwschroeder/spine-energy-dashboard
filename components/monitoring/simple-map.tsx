'use client';

import { useEffect, useRef } from 'react';
import type { Device } from '@/lib/api/types';
import * as L from 'leaflet';

interface SimpleMapProps {
  devices: Device[];
}

export function SimpleMap({ devices }: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet only on client side
    import('leaflet').then((L) => {

      // Initialize map
      const map = L.map(mapRef.current!, {
        center: [51.1657, 10.4515], // Germany center
        zoom: 6,
      });

      mapInstanceRef.current = map;

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Add markers for devices with locations
      devices.forEach((device) => {
        if (device.config?.location?.latitude && device.config?.location?.longitude) {
          const color = {
            green: '#10b981',
            yellow: '#eab308',
            red: '#ef4444',
            grey: '#9ca3af',
          }[device.signal] || '#9ca3af';

          const svgIcon = `
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
            </svg>
          `;

          const icon = L.divIcon({
            html: svgIcon,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            className: 'custom-div-icon',
          });

          const marker = L.marker(
            [device.config.location.latitude, device.config.location.longitude],
            { icon }
          ).addTo(map);

          // Add popup
          const popupContent = `
            <div style="padding: 8px; min-width: 200px;">
              <h4 style="font-weight: 600; margin-bottom: 8px;">${device.device_id}</h4>
              ${device.alias ? `<p style="color: #666; font-size: 12px; margin-bottom: 8px;">${device.alias}</p>` : ''}
              <div style="font-size: 12px;">
                <p><strong>Signal:</strong> ${device.signal}</p>
                ${device.config.location.description ? `<p><strong>Standort:</strong> ${device.config.location.description}</p>` : ''}
                ${device.lastOnline ? `<p><strong>Letzter Kontakt:</strong> ${new Date(device.lastOnline).toLocaleString('de-DE')}</p>` : ''}
              </div>
            </div>
          `;
          marker.bindPopup(popupContent);
        }
      });

      // Fit bounds to markers if any
      const validLocations = devices
        .filter(d => d.config?.location?.latitude && d.config?.location?.longitude)
        .map(d => [d.config!.location!.latitude, d.config!.location!.longitude] as [number, number]);

      if (validLocations.length > 0) {
        const bounds = L.latLngBounds(validLocations);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [devices]);

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: '8px' }}
    />
  );
}