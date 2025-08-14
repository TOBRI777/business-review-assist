import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

import { useUserSettings } from '@/hooks/useUserSettings';
import { useLocations } from '@/hooks/useLocations';
import { useGoogleOAuth } from '@/hooks/useGoogleOAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Key, MessageSquare, Building2, Eye, EyeOff, Link, CheckCircle, XCircle } from 'lucide-react';

const DashboardSettings = () => {
  const { settings, loading: settingsLoading, updateSettings } = useUserSettings();
  const { locations, updateLocationSettings } = useLocations();
  const { initiateGoogleOAuth, disconnectGoogle, loading: oauthLoading } = useGoogleOAuth();
  const navigate = useNavigate();

  const [globalTone, setGlobalTone] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);

  useEffect(() => {
    if (settings) {
      setGlobalTone(settings.global_tone || '');
    }
  }, [settings]);

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const handleSaveGlobalSettings = async () => {
    await updateSettings({
      global_tone: globalTone,
    });
  };

  const handleSaveOpenaiApiKey = async () => {
    if (openaiApiKey.trim()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('https://ykodpjvlwdwxgcmtsmtu.supabase.co/functions/v1/save-openai-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ openaiKey: openaiApiKey }),
        });

        if (!response.ok) {
          throw new Error('Failed to save OpenAI key');
        }

        setOpenaiApiKey('');
        // Trigger a refetch of settings to show the updated state
        window.location.reload();
      } catch (error) {
        console.error('Error saving OpenAI key:', error);
      }
    }
  };

  const handleLocationApprovalToggle = async (locationId: string, requiresApproval: boolean) => {
    await updateLocationSettings(locationId, { requires_approval: requiresApproval });
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-text-primary">Paramètres</h1>
            <p className="text-text-muted">Configurez vos clés API et préférences</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Google OAuth Section */}
          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-6">
              <Link className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold text-text-primary">Connexion Google Business</h2>
            </div>

            <div className="space-y-4">
              {/* Google Connection Status */}
              <div className="flex items-center justify-between p-4 border border-primary/10 rounded-lg">
                <div className="flex items-center gap-3">
                  {settings?.google_connected_email ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-text-muted" />
                  )}
                  <div>
                    <p className="font-medium text-text-primary">
                      {settings?.google_connected_email ? 'Connecté' : 'Non connecté'}
                    </p>
                    {settings?.google_connected_email && (
                      <p className="text-sm text-text-muted">{settings.google_connected_email}</p>
                    )}
                  </div>
                </div>
                
                {settings?.google_connected_email ? (
                  <Button 
                    variant="outline" 
                    onClick={disconnectGoogle}
                    disabled={oauthLoading}
                  >
                    Déconnecter
                  </Button>
                ) : (
                  <Button 
                    onClick={initiateGoogleOAuth}
                    disabled={oauthLoading}
                  >
                    Connecter Google
                  </Button>
                )}
              </div>
              
              <p className="text-sm text-text-muted">
                Connectez votre compte Google pour accéder à vos établissements Google Business via OAuth (recommandé)
              </p>
            </div>
          </Card>

          {/* OpenAI API Key Section */}
          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold text-text-primary">Clé API OpenAI (BYOK)</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-api-key">Clé API OpenAI</Label>
                <div className="relative">
                  <Input
                    id="openai-api-key"
                    type={showOpenaiKey ? "text" : "password"}
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder={settings?.openai_api_key_encrypted ? "••••••••••••••••" : "Entrez votre clé API OpenAI"}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  >
                    {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm text-text-muted">
                  Utilisée pour générer les réponses automatiques aux avis (Bring Your Own Key)
                </p>
              </div>

              <Button onClick={handleSaveOpenaiApiKey} className="w-full">
                Sauvegarder la clé OpenAI
              </Button>
            </div>
          </Card>

          {/* Global Tone Section */}
          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold text-text-primary">Ton global</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="global-tone">Instructions pour l'IA</Label>
                <Textarea
                  id="global-tone"
                  value={globalTone}
                  onChange={(e) => setGlobalTone(e.target.value)}
                  placeholder="Ex: Répondez de manière professionnelle et amicale. Remerciez toujours le client pour son avis..."
                  className="min-h-[100px]"
                />
                <p className="text-sm text-text-muted">
                  Ces instructions seront utilisées par défaut pour générer toutes les réponses
                </p>
              </div>

              <Button onClick={handleSaveGlobalSettings} className="w-full">
                Sauvegarder le ton global
              </Button>
            </div>
          </Card>

          {/* Location Settings Section */}
          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold text-text-primary">Paramètres par établissement</h2>
            </div>

            {locations.length === 0 ? (
              <p className="text-text-muted text-center py-8">
                Aucun établissement connecté. Connectez vos établissements Google Business pour configurer leurs paramètres.
              </p>
            ) : (
              <div className="space-y-4">
                {locations.map((location) => (
                  <div key={location.id} className="border border-primary/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-text-primary">{location.name}</h3>
                        {location.address && (
                          <p className="text-sm text-text-muted">{location.address}</p>
                        )}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Approbation manuelle des réponses</Label>
                          <p className="text-xs text-text-muted">
                            Activé: Les réponses doivent être approuvées avant envoi
                          </p>
                        </div>
                        <Switch
                          checked={location.location_settings?.requires_approval ?? true}
                          onCheckedChange={(checked) => handleLocationApprovalToggle(location.id, checked)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardSettings;