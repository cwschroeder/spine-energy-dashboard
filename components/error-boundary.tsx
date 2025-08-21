'use client';

import { useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  const is401Error = error.message?.includes('401') || error.message?.includes('Unauthorized');

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {is401Error ? 'API-Zugriff verweigert' : 'Ein Fehler ist aufgetreten'}
          </AlertTitle>
          <AlertDescription>
            {is401Error ? (
              <>
                Der API-Key ist ungültig oder nicht autorisiert.
                Bitte konfigurieren Sie einen gültigen API-Key in den Einstellungen.
              </>
            ) : (
              error.message || 'Ein unerwarteter Fehler ist aufgetreten.'
            )}
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-2">
          {is401Error && (
            <Button onClick={() => router.push('/settings')}>
              Zu den Einstellungen
            </Button>
          )}
          <Button variant="outline" onClick={reset}>
            Erneut versuchen
          </Button>
        </div>
      </div>
    </div>
  );
}