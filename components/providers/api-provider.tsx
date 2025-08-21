'use client';

import { useEffect } from 'react';
import { spineApi } from '@/lib/api/client';

const DEFAULT_API_KEY = '7toghKl3d8hhkIa8fDe5ItXisW6yo6';

export function ApiProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check localStorage for custom key after mount
    if (typeof window !== 'undefined') {
      try {
        const customToken = localStorage.getItem('spineApiToken') || localStorage.getItem('spine_api_token');
        if (customToken && customToken.length > 0 && customToken !== DEFAULT_API_KEY) {
          spineApi.setApiToken(customToken);
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, []);

  return <>{children}</>;
}