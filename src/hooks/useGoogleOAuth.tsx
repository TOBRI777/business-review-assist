import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useGoogleOAuth = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const initiateGoogleOAuth = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour lier votre compte Google",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get OAuth URL from our Edge Function
      const { data, error } = await supabase.functions.invoke('google-oauth-initiate');
      
      if (error) {
        throw error;
      }

      if (data?.authUrl) {
        // Store user ID for callback
        localStorage.setItem('oauth_user_id', user.id);
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      }

    } catch (error) {
      console.error('Error initiating Google OAuth:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'initier la connexion Google",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectGoogle = async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          google_oauth_access_token_encrypted: null,
          google_oauth_refresh_token_encrypted: null,
          google_oauth_token_expiry: null,
          google_oauth_scope: null,
          google_connected_email: null,
          google_connected_at: null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Compte Google déconnecté avec succès",
      });

    } catch (error) {
      console.error('Error disconnecting Google:', error);
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter le compte Google",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    initiateGoogleOAuth,
    disconnectGoogle,
    loading,
  };
};