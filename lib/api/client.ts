import axios from 'axios';
import type { DeviceListResponse, DeviceDetails, Group } from './types';

const API_BASE_URL = 'https://api.spine.energy';

// Default API key - hardcoded fallback
const DEFAULT_API_KEY = '7toghKl3d8hhkIa8fDe5ItXisW6yo6';

class SpineApiClient {
  private apiToken: string = DEFAULT_API_KEY;

  constructor(apiToken?: string) {
    // Always start with the default key
    this.apiToken = DEFAULT_API_KEY;
    
    // Only override if explicitly provided
    if (apiToken && apiToken.length > 0) {
      this.apiToken = apiToken;
    }
    // Remove localStorage check from constructor to avoid SSR issues
  }

  setApiToken(token: string) {
    this.apiToken = token || DEFAULT_API_KEY;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('spineApiToken', token);
      } catch (e) {
        console.error('Failed to save token to localStorage:', e);
      }
    }
  }

  clearApiToken() {
    // Reset to default instead of null
    this.apiToken = DEFAULT_API_KEY;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('spineApiToken');
        localStorage.removeItem('spine_api_token');
      } catch (e) {
        console.error('Failed to clear token from localStorage:', e);
      }
    }
  }

  getApiToken() {
    // Always return at least the default key
    return this.apiToken || DEFAULT_API_KEY;
  }

  private getHeaders() {
    // Always use a token - fallback chain ensures we always have one
    const token = this.apiToken || DEFAULT_API_KEY;
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getGroups(): Promise<Group[]> {
    const response = await axios.get(`${API_BASE_URL}/auth/groups`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async getDeviceList(page: number = 1, per: number = 50): Promise<DeviceListResponse> {
    const response = await axios.get(`${API_BASE_URL}/smgw/v2/list`, {
      headers: this.getHeaders(),
      params: { page, per },
    });
    return response.data;
  }

  async getDeviceDetails(deviceId: string): Promise<DeviceDetails> {
    const response = await axios.get(`${API_BASE_URL}/smgw/v2/details`, {
      headers: this.getHeaders(),
      params: { deviceId },
    });
    return response.data;
  }

  async getLiveData(deviceId: string): Promise<unknown> {
    const response = await axios.get(`${API_BASE_URL}/smgw/v2/live`, {
      headers: this.getHeaders(),
      params: { deviceId },
    });
    return response.data;
  }

  async importDevices(csvFile: File): Promise<unknown> {
    const formData = new FormData();
    formData.append('file', csvFile);

    const response = await axios.post(`${API_BASE_URL}/smgw/import`, formData, {
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getServiceHealth(): Promise<unknown> {
    const response = await axios.get(`${API_BASE_URL}/service/health`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async getServiceVersion(): Promise<unknown> {
    const response = await axios.get(`${API_BASE_URL}/service/version`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async getServiceName(): Promise<unknown> {
    const response = await axios.get(`${API_BASE_URL}/service/name`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }
}

// Create singleton instance with default key
export const spineApi = new SpineApiClient();

// Export class for custom instances if needed
export default SpineApiClient;