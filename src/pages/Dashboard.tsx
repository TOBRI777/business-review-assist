import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Building2, Settings, MessageSquare, Clock, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { locations, loading: locationsLoading } = useLocations();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || locationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) return null;

  const activeLocations = locations.filter(loc => loc.is_active);
  const locationsWithApproval = locations.filter(loc => loc.location_settings?.requires_approval);
  const locationsWithAutoReply = locations.filter(loc => !loc.location_settings?.requires_approval);

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">
              Tableau de bord
            </h1>
            <p className="text-text-muted">
              Gérez vos établissements et réponses automatiques
            </p>
          </div>
          <Button 
            onClick={() => navigate('/dashboard/settings')}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Paramètres
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Établissements connectés"
            value={activeLocations.length}
            description="Établissements actifs"
            icon={Building2}
          />
          <StatsCard
            title="Approbation manuelle"
            value={locationsWithApproval.length}
            description="Nécessitent validation"
            icon={Clock}
          />
          <StatsCard
            title="Réponse automatique"
            value={locationsWithAutoReply.length}
            description="Envoi direct"
            icon={CheckCircle}
          />
          <StatsCard
            title="Avis traités"
            value="0"
            description="Ce mois-ci"
            icon={MessageSquare}
          />
        </div>

        {/* Locations Overview */}
        <Card className="glass p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-text-primary">
              Vos établissements
            </h2>
            <Button variant="outline" size="sm">
              Connecter un établissement
            </Button>
          </div>

          {locations.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Aucun établissement connecté
              </h3>
              <p className="text-text-muted mb-6">
                Connectez votre premier établissement Google Business pour commencer
              </p>
              <Button>
                Connecter un établissement
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map((location) => (
                <div 
                  key={location.id}
                  className="flex items-center justify-between p-4 border border-primary/10 rounded-lg hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{location.name}</h3>
                      {location.address && (
                        <p className="text-sm text-text-muted">{location.address}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-primary">
                        {location.location_settings?.requires_approval ? 'Approbation manuelle' : 'Réponse automatique'}
                      </p>
                      <p className="text-xs text-text-muted">
                        {location.is_active ? 'Actif' : 'Inactif'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Gérer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;