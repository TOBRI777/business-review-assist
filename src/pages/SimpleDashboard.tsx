import { useReviews } from '@/hooks/useReviews';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const SimpleReviewCard = ({ review, onApprove }) => {
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
        }`}
      />
    ));
  };

  return (
    <Card className="p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg">{review.author_name}</h3>
            <div className="flex items-center gap-1">
              {renderStars(review.rating)}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            {format(new Date(review.review_date), 'dd MMM yyyy', { locale: fr })}
          </p>
          {review.location && (
            <p className="text-sm text-muted-foreground">
              📍 {review.location.name}
            </p>
          )}
        </div>
        
        {review.reply && (
          <Badge variant={review.reply.status === 'pending' ? 'secondary' : 'default'}>
            {review.reply.status === 'pending' ? 'En attente' : 
             review.reply.status === 'approved' ? 'Approuvé' : 
             review.reply.status === 'sent' ? 'Envoyé' : 'Rejeté'}
          </Badge>
        )}
      </div>

      {review.review_text && (
        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm leading-relaxed">"{review.review_text}"</p>
        </div>
      )}

      {review.reply && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2 text-sm">Réponse proposée :</h4>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm">{review.reply.generated_reply}</p>
          </div>
          
          {review.reply.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                onClick={() => onApprove(review.reply.id)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Approuver & Envoyer
              </Button>
            </div>
          )}

          {review.reply.status === 'sent' && (
            <p className="text-xs text-green-600 font-medium">
              ✅ Réponse envoyée le {format(new Date(review.reply.sent_at), 'dd MMM à HH:mm', { locale: fr })}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

const SimpleDashboard = () => {
  const { reviews, loading, approveReply } = useReviews();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Filtrer pour montrer seulement les avis récents avec des réponses
  const recentReviewsWithReplies = reviews
    .filter(review => review.reply)
    .sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime())
    .slice(0, 20);

  const pendingCount = recentReviewsWithReplies.filter(r => r.reply?.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header simple */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Avis clients</h1>
            <p className="text-muted-foreground">
              {pendingCount > 0 ? `${pendingCount} réponse(s) en attente d'approbation` : 'Toutes les réponses sont traitées'}
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={() => navigate('/dashboard/settings')}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Paramètres
          </Button>
        </div>

        {/* Liste des avis */}
        {recentReviewsWithReplies.length === 0 ? (
          <Card className="p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">Aucun avis récent</h3>
            <p className="text-muted-foreground mb-6">
              Les nouveaux avis avec réponses automatiques apparaîtront ici
            </p>
            <Button onClick={() => navigate('/dashboard/settings')}>
              Configurer le système
            </Button>
          </Card>
        ) : (
          <div>
            {recentReviewsWithReplies.map((review) => (
              <SimpleReviewCard
                key={review.id}
                review={review}
                onApprove={approveReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleDashboard;