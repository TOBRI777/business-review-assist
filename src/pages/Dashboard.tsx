import { useNavigate } from 'react-router-dom';
import { useLocations } from '@/hooks/useLocations';
import { useReviews } from '@/hooks/useReviews';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AdminControls } from '@/components/dashboard/AdminControls';
import { ReviewCard } from '@/components/dashboard/ReviewCard';
import { Building2, Settings, MessageSquare, Clock, CheckCircle, Star } from 'lucide-react';

const Dashboard = () => {
  const { locations, loading: locationsLoading } = useLocations();
  const { reviews, loading: reviewsLoading, approveReply, rejectReply } = useReviews();
  const navigate = useNavigate();

  if (locationsLoading || reviewsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  

  const activeLocations = locations.filter(loc => loc.is_active);
  const pendingReplies = reviews.filter(review => review.reply?.status === 'pending');
  const approvedReplies = reviews.filter(review => review.reply?.status === 'approved');
  const totalReviews = reviews.length;

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
            title="Avis reçus"
            value={totalReviews}
            description="Depuis l'inscription"
            icon={Star}
          />
          <StatsCard
            title="En attente d'approbation"
            value={pendingReplies.length}
            description="Réponses à valider"
            icon={Clock}
          />
          <StatsCard
            title="Réponses approuvées"
            value={approvedReplies.length}
            description="Prêtes à envoyer"
            icon={CheckCircle}
          />
          <StatsCard
            title="Établissements connectés"
            value={activeLocations.length}
            description="Établissements actifs"
            icon={Building2}
          />
        </div>

        {/* Admin Controls */}
        <div className="mb-8">
          <AdminControls />
        </div>

        {/* Reviews Overview */}
        <Card className="glass p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-text-primary">
              Avis reçus récemment
            </h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/dashboard/settings')}
            >
              Paramètres
            </Button>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Aucun avis reçu
              </h3>
              <p className="text-text-muted mb-6">
                Les nouveaux avis de vos établissements apparaîtront ici
              </p>
              <Button onClick={() => navigate('/dashboard/settings')}>
                Configurer vos établissements
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 10).map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onApproveReply={approveReply}
                  onRejectReply={rejectReply}
                />
              ))}
              {reviews.length > 10 && (
                <div className="text-center pt-4">
                  <Button variant="outline">
                    Voir tous les avis ({reviews.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;