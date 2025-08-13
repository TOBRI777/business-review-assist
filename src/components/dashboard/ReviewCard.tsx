import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, Clock, ExternalLink } from "lucide-react";

interface ReviewCardProps {
  review: {
    id: string;
    author: string;
    rating: number;
    text: string;
    createdAt: string;
    locationName: string;
    hasReply: boolean;
    replyStatus?: "draft" | "sent" | "pending";
  };
  onGenerateReply?: (reviewId: string) => void;
  onApproveReply?: (reviewId: string) => void;
}

export const ReviewCard = ({ review, onGenerateReply, onApproveReply }: ReviewCardProps) => {
  const getStatusBadge = () => {
    if (review.hasReply) {
      return <Badge className="bg-success/10 text-success border-success/20">Répondu</Badge>;
    }
    if (review.replyStatus === "draft") {
      return <Badge className="bg-warning/10 text-warning border-warning/20">Brouillon</Badge>;
    }
    if (review.replyStatus === "pending") {
      return <Badge className="bg-primary/10 text-primary border-primary/20">En attente</Badge>;
    }
    return <Badge variant="outline" className="border-destructive/20 text-destructive">À répondre</Badge>;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating 
            ? "fill-yellow-400 text-yellow-400" 
            : "text-text-subtle"
        }`}
      />
    ));
  };

  return (
    <div className="glass p-6 rounded-2xl border border-primary/10 hover:border-primary/20 transition-all duration-300 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-text-primary">{review.author}</h3>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <div className="flex">{renderStars(review.rating)}</div>
            <span>•</span>
            <span>{review.locationName}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(review.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="flex-shrink-0">
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* Review Text */}
      <div className="p-4 bg-surface-secondary rounded-xl">
        <p className="text-text-primary leading-relaxed">
          {review.text}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        {!review.hasReply && !review.replyStatus && (
          <Button 
            size="sm" 
            onClick={() => onGenerateReply?.(review.id)}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Générer réponse
          </Button>
        )}
        
        {review.replyStatus === "draft" && (
          <Button 
            size="sm" 
            variant="accent"
            onClick={() => onApproveReply?.(review.id)}
            className="flex items-center gap-2"
          >
            Approuver & Envoyer
          </Button>
        )}
        
        {review.replyStatus === "pending" && (
          <Button size="sm" variant="outline" disabled>
            Envoi en cours...
          </Button>
        )}
        
        <Button variant="ghost" size="sm">
          Voir les détails
        </Button>
      </div>
    </div>
  );
};