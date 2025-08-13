import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, RefreshCw, Download, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const GoogleBusinessCard = () => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConnectLocations = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('connect-google-locations');
      
      if (error) throw error;

      toast({
        title: "Succès",
        description: `${data.newLocations} nouveaux établissements connectés sur ${data.totalLocations} trouvés`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de connecter les établissements Google Business",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFetchReviews = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-google-reviews');
      
      if (error) throw error;

      toast({
        title: "Succès",
        description: `${data.newReviews} nouveaux avis récupérés`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les avis Google",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleProcessReviews = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-review-cron');
      
      if (error) throw error;

      toast({
        title: "Traitement terminé",
        description: `${data.summary.repliesGenerated} réponses générées, ${data.summary.repliesSent} envoyées`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement automatique",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="glass p-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Google My Business</h2>
          <p className="text-text-muted">Gestion automatisée des avis clients</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-primary/10 rounded-lg">
          <div>
            <h3 className="font-medium text-text-primary">Connecter les établissements</h3>
            <p className="text-sm text-text-muted">Synchroniser vos établissements Google Business</p>
          </div>
          <Button 
            onClick={handleConnectLocations}
            disabled={isConnecting}
            className="flex items-center gap-2"
          >
            {isConnecting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Building2 className="w-4 h-4" />
            )}
            {isConnecting ? 'Connexion...' : 'Connecter'}
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border border-primary/10 rounded-lg">
          <div>
            <h3 className="font-medium text-text-primary">Récupérer les nouveaux avis</h3>
            <p className="text-sm text-text-muted">Télécharger les derniers avis depuis Google</p>
          </div>
          <Button 
            onClick={handleFetchReviews}
            disabled={isFetching}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isFetching ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isFetching ? 'Récupération...' : 'Récupérer'}
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border border-primary/10 rounded-lg">
          <div>
            <h3 className="font-medium text-text-primary">Traitement automatique</h3>
            <p className="text-sm text-text-muted">Générer et envoyer les réponses automatiquement</p>
            <Badge variant="secondary" className="mt-1">
              Cron toutes les 15 min
            </Badge>
          </div>
          <Button 
            onClick={handleProcessReviews}
            disabled={isProcessing}
            variant="default"
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isProcessing ? 'Traitement...' : 'Lancer maintenant'}
          </Button>
        </div>

        <div className="text-xs text-text-muted bg-muted/20 p-3 rounded-lg">
          💡 <strong>Automatisation :</strong> Le système vérifie automatiquement les nouveaux avis toutes les 15 minutes, 
          génère des réponses IA et les envoie selon vos paramètres d'approbation.
        </div>
      </div>
    </Card>
  );
};