import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Download, Zap, Send, Building2 } from 'lucide-react';

export const AdminControls = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});

  const handleAction = async (action: string, endpoint: string, data?: any) => {
    setLoading(prev => ({ ...prev, [action]: true }));
    
    try {
      const { data: result, error } = await supabase.functions.invoke(endpoint, {
        body: data || {},
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: result.message || `Action ${action} exécutée avec succès`,
      });

      return result;
    } catch (error) {
      console.error(`Error in ${action}:`, error);
      toast({
        title: "Erreur",
        description: `Échec de l'action ${action}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  return (
    <Card className="glass p-6">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-semibold text-text-primary">Actions Administrateur</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Connect Google Locations */}
        <Button
          onClick={() => handleAction('connect-locations', 'connect-google-locations')}
          disabled={loading['connect-locations']}
          className="flex items-center gap-2 h-auto p-4 flex-col"
          variant="outline"
        >
          {loading['connect-locations'] ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Building2 className="w-5 h-5" />
          )}
          <div className="text-center">
            <div className="font-medium">Connecter Établissements</div>
            <div className="text-sm text-muted-foreground">
              Récupérer vos établissements Google Business
            </div>
          </div>
        </Button>

        {/* Fetch New Reviews */}
        <Button
          onClick={() => handleAction('fetch-reviews', 'fetch-google-reviews')}
          disabled={loading['fetch-reviews']}
          className="flex items-center gap-2 h-auto p-4 flex-col"
          variant="outline"
        >
          {loading['fetch-reviews'] ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          <div className="text-center">
            <div className="font-medium">Récupérer Avis</div>
            <div className="text-sm text-muted-foreground">
              Synchroniser les nouveaux avis Google
            </div>
          </div>
        </Button>

        {/* Generate AI Replies for Latest Review */}
        <Button
          onClick={async () => {
            // Get the latest review without a reply
            const { data: reviews } = await supabase
              .from('reviews')
              .select('id')
              .not('id', 'in', 
                `(${(await supabase.from('review_replies').select('review_id')).data?.map(r => r.review_id).join(',') || 'null'})`
              )
              .order('created_at', { ascending: false })
              .limit(1);

            if (reviews && reviews.length > 0) {
              await handleAction('generate-reply', 'generate-ai-reply', { reviewId: reviews[0].id });
            } else {
              toast({
                title: "Information",
                description: "Aucun avis sans réponse trouvé",
              });
            }
          }}
          disabled={loading['generate-reply']}
          className="flex items-center gap-2 h-auto p-4 flex-col"
          variant="outline"
        >
          {loading['generate-reply'] ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Zap className="w-5 h-5" />
          )}
          <div className="text-center">
            <div className="font-medium">Générer Réponse IA</div>
            <div className="text-sm text-muted-foreground">
              Créer une réponse pour le dernier avis
            </div>
          </div>
        </Button>

        {/* Send Approved Replies */}
        <Button
          onClick={async () => {
            // Get approved replies
            const { data: replies } = await supabase
              .from('review_replies')
              .select('id')
              .eq('status', 'approved')
              .limit(1);

            if (replies && replies.length > 0) {
              await handleAction('send-reply', 'send-reply', { replyId: replies[0].id });
            } else {
              toast({
                title: "Information",
                description: "Aucune réponse approuvée à envoyer",
              });
            }
          }}
          disabled={loading['send-reply']}
          className="flex items-center gap-2 h-auto p-4 flex-col"
          variant="outline"
        >
          {loading['send-reply'] ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          <div className="text-center">
            <div className="font-medium">Envoyer Réponses</div>
            <div className="text-sm text-muted-foreground">
              Publier les réponses approuvées
            </div>
          </div>
        </Button>

        {/* Run Full Automation */}
        <Button
          onClick={() => handleAction('auto-process', 'auto-review-cron')}
          disabled={loading['auto-process']}
          className="flex items-center gap-2 h-auto p-4 flex-col md:col-span-2"
        >
          {loading['auto-process'] ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Zap className="w-5 h-5" />
          )}
          <div className="text-center">
            <div className="font-medium">Exécuter Automation Complète</div>
            <div className="text-sm text-muted-foreground">
              Récupérer avis → Générer réponses → Envoyer réponses approuvées
            </div>
          </div>
        </Button>
      </div>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-medium text-text-primary mb-2">ℹ️ Information</h3>
        <p className="text-sm text-text-muted">
          Ces actions vous permettent de tester manuellement le système d'automatisation. 
          Le cron automatique s'exécute toutes les 15 minutes pour traiter les avis automatiquement.
        </p>
      </div>
    </Card>
  );
};