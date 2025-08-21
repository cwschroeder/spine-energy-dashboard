'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { spineApi } from '@/lib/api/client';
import { Key, Save, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const DEFAULT_KEY = '7toghKl3d8hhkIa8fDe5ItXisW6yo6';
  const [apiToken, setApiToken] = useState('');
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isUsingDefault, setIsUsingDefault] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedToken = spineApi.getApiToken();
      // Token is always available (either custom or default)
      setApiToken(savedToken || DEFAULT_KEY);
      setIsTokenSaved(true);
      setIsUsingDefault(!savedToken || savedToken === DEFAULT_KEY);
    } catch (e) {
      // If there's an error, use default
      setApiToken(DEFAULT_KEY);
      setIsTokenSaved(true);
      setIsUsingDefault(true);
    }
  }, [DEFAULT_KEY]);

  const handleSaveToken = () => {
    if (!apiToken.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie einen API-Token ein.',
        variant: 'destructive',
      });
      return;
    }

    spineApi.setApiToken(apiToken);
    setIsTokenSaved(true);
    setIsUsingDefault(apiToken === DEFAULT_KEY);
    toast({
      title: 'Erfolg',
      description: 'API-Token wurde gespeichert.',
    });
  };

  const handleRemoveToken = () => {
    spineApi.clearApiToken();
    // Reset to default key
    const defaultToken = spineApi.getApiToken();
    setApiToken(defaultToken || DEFAULT_KEY);
    setIsTokenSaved(true);
    setIsUsingDefault(true);
    toast({
      title: 'Token zurückgesetzt',
      description: 'Der API-Token wurde auf den Standard zurückgesetzt.',
    });
  };

  const handleTestConnection = async () => {
    if (!apiToken.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte speichern Sie zuerst einen API-Token.',
        variant: 'destructive',
      });
      return;
    }

    setIsTestingConnection(true);
    try {
      await spineApi.getServiceHealth();
      toast({
        title: 'Verbindung erfolgreich',
        description: 'Die Verbindung zur SPiNE API wurde erfolgreich hergestellt.',
      });
    } catch (error) {
      toast({
        title: 'Verbindungsfehler',
        description: 'Die Verbindung zur SPiNE API konnte nicht hergestellt werden.',
        variant: 'destructive',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre API-Zugangsdaten und Anwendungseinstellungen
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API-Konfiguration</CardTitle>
            <CardDescription>
              Konfigurieren Sie Ihren SPiNE Energy API-Zugang
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="api-token">API Token</Label>
              <div className="flex space-x-2">
                <Input
                  id="api-token"
                  type="password"
                  placeholder="Ihr SPiNE API Token"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="font-mono"
                />
                <Button onClick={handleSaveToken} disabled={isTokenSaved && apiToken === (spineApi.getApiToken() || DEFAULT_KEY)}>
                  <Save className="h-4 w-4 mr-2" />
                  Speichern
                </Button>
                {!isUsingDefault && (
                  <Button variant="outline" onClick={handleRemoveToken}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Zurücksetzen
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Den API-Token erhalten Sie im SPiNE Portal unter{' '}
                <a
                  href="https://portal.spine.energy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  portal.spine.energy
                </a>
              </p>
            </div>

            {isTokenSaved && (
              <Alert className={isUsingDefault ? "border-blue-200 bg-blue-50" : ""}>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {isUsingDefault ? (
                    <>
                      <strong>Standard-API-Token ist aktiv.</strong><br />
                      Die Anwendung verwendet automatisch den Standard-Token für alle API-Anfragen.
                    </>
                  ) : (
                    'Eigener API-Token ist gespeichert und wird für alle API-Anfragen verwendet.'
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-4 border-t">
              <Button
                onClick={handleTestConnection}
                disabled={!isTokenSaved || isTestingConnection}
                variant="outline"
              >
                {isTestingConnection ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Teste Verbindung...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Verbindung testen
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API-Informationen</CardTitle>
            <CardDescription>
              Wichtige Informationen zur SPiNE Energy API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Endpunkte</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-muted-foreground">Base URL</dt>
                  <dd className="font-mono">https://api.spine.energy</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Geräteliste</dt>
                  <dd className="font-mono">/smgw/v2/list</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Gerätedetails</dt>
                  <dd className="font-mono">/smgw/v2/details</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Live-Daten</dt>
                  <dd className="font-mono">/smgw/v2/live</dd>
                </div>
              </dl>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Hinweis:</strong> Der API-Token wird lokal in Ihrem Browser gespeichert
                und nie an externe Server übertragen (außer an die SPiNE API).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hilfe & Support</CardTitle>
            <CardDescription>
              Unterstützung bei Problemen mit der API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Kontakt</h3>
              <p className="text-sm text-muted-foreground">
                Bei Fragen zur API wenden Sie sich bitte an:{' '}
                <a
                  href="mailto:dev@spine.energy"
                  className="text-primary hover:underline"
                >
                  dev@spine.energy
                </a>
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Dokumentation</h3>
              <p className="text-sm text-muted-foreground">
                Die vollständige API-Dokumentation finden Sie im{' '}
                <a
                  href="https://help.spine.energy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  SPiNE Help Center
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}