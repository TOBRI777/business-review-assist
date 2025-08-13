import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  location_id: string;
  google_review_id: string;
  author_name: string;
  author_photo_url?: string;
  rating: number;
  review_text?: string;
  review_date: string;
  created_at: string;
  updated_at: string;
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
}

export const useReviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          locations (
            name
          ),
          review_replies (
            id,
            generated_reply,
            status,
            approved_at,
            sent_at
          )
        `)
        .order('review_date', { ascending: false });

      if (error) throw error;

      const formattedReviews = data.map(review => ({
        ...review,
        location: review.locations,
        reply: review.review_replies?.[0] ? {
          ...review.review_replies[0],
          status: review.review_replies[0].status as 'pending' | 'approved' | 'rejected' | 'sent'
        } : null
      })) as Review[];

      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les avis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveReply = async (replyId: string) => {
    try {
      const { error } = await supabase
        .from('review_replies')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', replyId);

      if (error) throw error;

      await fetchReviews();
      toast({
        title: "Succès",
        description: "Réponse approuvée",
      });
    } catch (error) {
      console.error('Error approving reply:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'approuver la réponse",
        variant: "destructive",
      });
    }
  };

  const rejectReply = async (replyId: string) => {
    try {
      const { error } = await supabase
        .from('review_replies')
        .update({
          status: 'rejected',
        })
        .eq('id', replyId);

      if (error) throw error;

      await fetchReviews();
      toast({
        title: "Succès",
        description: "Réponse rejetée",
      });
    } catch (error) {
      console.error('Error rejecting reply:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter la réponse",
        variant: "destructive",
      });
    }
  };

  return {
    reviews,
    loading,
    approveReply,
    rejectReply,
    refetch: fetchReviews,
  };
};