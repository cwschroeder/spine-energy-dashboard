import type { Device } from '@/lib/api/types';
import { format } from 'date-fns';

export function exportToCSV(devices: Device[], filename: string = 'devices_export.csv') {
  const headers = [
    'Geräte-ID',
    'Alias',
    'Typ',
    'Status',
    'Signalstärke (dBm)',
    'Netzwerk',
    'IP-Adresse',
    'Letzter Kontakt',
    'Standort',
    'Latitude',
    'Longitude',
    'Update-Intervall',
    'Registrierungs-ID'
  ];

  const rows = devices.map(device => {
    const latestReport = device.reports?.[0] || device.report;
    const network = latestReport?.network
      ? (Array.isArray(latestReport.network) 
          ? latestReport.network[0]?.name 
          : latestReport.network.name)
      : '';
    
    return [
      device.device_id,
      device.alias || '',
      device.device_type,
      device.signal,
      latestReport?.signalStrength || '',
      network,
      latestReport?.ips?.[0] || '',
      device.lastOnline ? format(new Date(device.lastOnline), 'yyyy-MM-dd HH:mm:ss') : '',
      device.config?.location?.description || '',
      device.config?.location?.latitude || '',
      device.config?.location?.longitude || '',
      device.config?.updateInterval || '',
      Array.isArray(latestReport?.registrationId) 
        ? latestReport.registrationId[0] 
        : latestReport?.registrationId || ''
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(devices: Device[], filename: string = 'devices_export.json') {
  const jsonContent = JSON.stringify(devices, null, 2);
  
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateExportFilename(prefix: string = 'spine_devices', extension: string = 'csv') {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  return `${prefix}_${timestamp}.${extension}`;
}