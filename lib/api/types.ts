export interface Device {
  device_id: string;
  alias: string | null;
  device_type: string;
  comment: string | null;
  signal: 'green' | 'yellow' | 'red' | 'grey';
  timestamp: string;
  config: DeviceConfig;
  tags: Record<string, unknown>;
  updated_at: string;
  deviceId: string;
  report?: SmgwReport;
  reports?: SmgwReport[];
  lastOnline?: string;
  firstOnline?: string;
  firstReport?: string;
  color: 'green' | 'yellow' | 'red' | 'grey';
}

export interface DeviceConfig {
  location?: {
    latitude: number;
    longitude: number;
    description?: string;
  };
  updateInterval?: string;
}

export interface SmgwReport {
  apns: string[];
  ips: string[];
  availableNetworks: Network[];
  network: Network | Network[];
  hasConnectionInfo: boolean | boolean[];
  lastSignal: string | string[];
  registrationDate: string | string[];
  address: string | string[];
  registrationId: string | string[];
  lac: number;
  snr: number;
  smcc: number;
  smnc: number;
  cellId: number;
  linkQuality: number;
  signalStrength: number;
  lifetime: number;
  reportTimestamp: string;
  fromTimestamp?: string;
  toTimestamp?: string;
  numDatasets?: number;
  expectedDatasetsPerReport?: number;
  isFuture?: boolean;
  detailFromTimestamp?: string;
  detailToTimestamp?: string;
  reconnects?: number;
  percentSuccess?: number;
  color?: 'green' | 'yellow' | 'red' | 'grey';
}

export interface Network {
  bearer: number;
  name: string;
}

export interface DeviceListResponse {
  total: string;
  page: number;
  per: number;
  devices: Device[];
}

export interface DeviceDetails extends Device {
  reportResolution?: string;
  reportAggregator?: string;
  reportStart?: string;
  reportEnd?: string;
  reportDurationMinutes?: number;
  expectedReportsPerInterval?: number;
  resolutionMinutes?: number;
  reconnects?: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  apiAccess: boolean;
}