// API Initialization Helper
// This ensures the API client is properly initialized with the default key

const DEFAULT_API_KEY = '7toghKl3d8hhkIa8fDe5ItXisW6yo6';

export function ensureApiKey(): string {
  if (typeof window !== 'undefined') {
    try {
      // Check if a key is already stored
      const storedKey = localStorage.getItem('spineApiToken') || localStorage.getItem('spine_api_token');
      if (storedKey && storedKey.length > 0) {
        return storedKey;
      }
      
      // Store default key if nothing is stored
      localStorage.setItem('spineApiToken', DEFAULT_API_KEY);
      localStorage.setItem('spine_api_token', DEFAULT_API_KEY);
      return DEFAULT_API_KEY;
    } catch (e) {
      console.log('LocalStorage not available, using default key');
      return DEFAULT_API_KEY;
    }
  }
  
  // Server-side or no window - return default
  return DEFAULT_API_KEY;
}

export function isUsingDefaultKey(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const storedKey = localStorage.getItem('spineApiToken') || localStorage.getItem('spine_api_token');
      return !storedKey || storedKey === DEFAULT_API_KEY;
    } catch (e) {
      return true;
    }
  }
  return true;
}

export { DEFAULT_API_KEY };