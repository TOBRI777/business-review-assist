import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, User, MapPin, Clock, CheckCircle, XCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReviewCardProps {
  review: {
    id: string;
    author_name: string;
    author_photo_url?: string;
    rating: number;
    review_text?: string;
    review_date: string;
    location?: {
      name: string;
    };
    reply?: {
      id: string;
      generated_reply: string;
      status: 'pending' | 'approved' | 'rejected' | 'sent';
      approved_at?: string;
      sent_at?: string;
    };
  };
  onApproveReply?: (replyId: string) => void;
  onRejectReply?: (replyId: string) => void;
}

export const ReviewCard = ({ review, onApproveReply, onRejectReply }: ReviewCardProps) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', variant: 'secondary' as const, icon: Clock },
      approved: { label: 'Approuvée', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejetée', variant: 'destructive' as const, icon: XCircle },
      sent: { label: 'Envoyée', variant: 'default' as const, icon: Send },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const renderStars = (rating: number) => {
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
    <Card className="glass p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {review.author_photo_url ? (
            <img
              src={review.author_photo_url}
              alt={review.author_name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-text-primary">{review.author_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                {renderStars(review.rating)}
              </div>
              <span className="text-sm text-text-muted">
                {format(new Date(review.review_date), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
          </div>
        </div>
        {review.reply && getStatusBadge(review.reply.status)}
      </div>

      {review.location && (
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-text-muted">{review.location.name}</span>
        </div>
      )}

      {review.review_text && (
        <p className="text-text-primary mb-4 leading-relaxed">
          {review.review_text}
        </p>
      )}

      {review.reply && (
        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-text-primary">Réponse générée :</span>
          </div>
          <p className="text-sm text-text-muted bg-muted/50 p-3 rounded-lg mb-3">
            {review.reply.generated_reply}
          </p>

          {review.reply.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onApproveReply?.(review.reply!.id)}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approuver & Envoyer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRejectReply?.(review.reply!.id)}
                className="flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Rejeter
              </Button>
            </div>
          )}

          {review.reply.status === 'approved' && review.reply.approved_at && (
            <p className="text-xs text-text-muted">
              Approuvée le {format(new Date(review.reply.approved_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
            </p>
          )}

          {review.reply.status === 'sent' && review.reply.sent_at && (
            <p className="text-xs text-text-muted">
              Envoyée le {format(new Date(review.reply.sent_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};